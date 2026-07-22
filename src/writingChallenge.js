export const WRITING_CHALLENGE_MAX_LENGTH = 80;
export const LOW_GRADE_TAP_CHALLENGE_ENABLED = false;

const DEVELOPMENT_HOSTS = new Set(["", "localhost", "127.0.0.1"]);

function warnInDevelopment(message) {
  if (typeof location === "undefined" || DEVELOPMENT_HOSTS.has(location.hostname)) console.warn(message);
}

const segmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter("ja", { granularity: "grapheme" })
  : null;

export function graphemes(value) {
  const text = String(value ?? "");
  if (segmenter) return [...segmenter.segment(text)].map((item) => item.segment);
  return Array.from(text);
}

export function graphemeLength(value) {
  return graphemes(value).length;
}

export function limitWritingAnswer(value, maxLength = WRITING_CHALLENGE_MAX_LENGTH) {
  const safeMax = Math.max(1, Math.min(WRITING_CHALLENGE_MAX_LENGTH, Number(maxLength) || WRITING_CHALLENGE_MAX_LENGTH));
  return graphemes(value).slice(0, safeMax).join("");
}

export function normalizeExtractAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\r\n\t]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("ja")
    .replace(/[。、，,.！!？?]+$/gu, "")
    .trim();
}

export function canonicalWritingType(challenge) {
  if (["challengeExtract", "extract"].includes(challenge?.type)) return "extract";
  if (challenge?.type === "shortReason") return "shortReason";
  if (challenge?.type === "opinion") return "opinion";
  return String(challenge?.type || "");
}

export function writingTypeLabel(challenge) {
  return { extract: "本文抜き出し", shortReason: "短文説明", opinion: "自分の考え" }[canonicalWritingType(challenge)] || "記述";
}

export function effectiveModelAnswers(challenge) {
  return [...new Set([...(challenge?.modelAnswers || []), challenge?.modelAnswer].filter(Boolean))];
}

export function isExactWritingChallengeAnswer(answer, challenge) {
  const normalized = normalizeExtractAnswer(answer);
  if (!normalized) return false;
  return (challenge?.acceptedAnswers || []).some((candidate) => normalizeExtractAnswer(candidate) === normalized);
}

const LOCAL_NEGATION_PATTERNS = [
  /^では?な(?:い|く|かった)/u,
  /^じゃな(?:い|く|かった)/u,
  /^でもな(?:い|く|かった)/u,
  /^もな(?:い|く|かった)/u,
  /^なかった/u,
  /^はどうでも(?:よい|いい)/u,
  /^どうでも(?:よい|いい)/u,
  /^は(?:必要|大切|重要)(?:では|じゃ)?な/u,
  /^は関係(?:が)?な/u,
  /^(?:という)?わけではな/u,
  /^(?:という)?ことではな/u,
  /^とは(?:い|言)えな/u
];

export function containsNonNegatedCriterionAlternative(answer, alternative) {
  const normalized = normalizeExtractAnswer(answer);
  const item = normalizeExtractAnswer(alternative);
  if (!item) return false;
  let offset = 0;
  while (offset < normalized.length) {
    const index = normalized.indexOf(item, offset);
    if (index < 0) return false;
    const tail = normalized.slice(index + item.length, index + item.length + 24).replace(/^[\s、,]+/u, "");
    if (!LOCAL_NEGATION_PATTERNS.some((pattern) => pattern.test(tail))) return true;
    offset = index + item.length;
  }
  return false;
}

export function evaluateWritingAnswer(answer, challenge) {
  const normalized = normalizeExtractAnswer(answer);
  if (!normalized) return { resultType: "empty", title: "答えを書いてから確かめましょう", metCriteria: [], requiredCriteriaCount: 0 };
  const type = canonicalWritingType(challenge);
  if (type === "extract") {
    return isExactWritingChallengeAnswer(answer, challenge)
      ? { resultType: "exact_match", title: "正解です！本文から正しく抜き出せました。", metCriteria: [], requiredCriteriaCount: 0 }
      : { resultType: "model_check", title: "お手本と比べてみましょう", metCriteria: [], requiredCriteriaCount: 0 };
  }
  if (type === "shortReason") {
    const contradiction = (challenge.contradictionPatterns || []).some((pattern) => {
      const item = normalizeExtractAnswer(pattern);
      return item && normalized.includes(item);
    });
    const metCriteria = contradiction ? [] : (challenge.criteria || []).filter((criterion) =>
      (criterion.alternatives || []).some((alternative) => containsNonNegatedCriterionAlternative(normalized, alternative))
    ).map((criterion) => criterion.label);
    const required = (challenge.criteria || []).filter((criterion) => criterion.required !== false);
    const requiredMet = required.filter((criterion) => metCriteria.includes(criterion.label)).length;
    if (!contradiction && required.length && requiredMet === required.length) {
      return { resultType: "criteria_complete", title: "関係する言葉が二つ見つかりました。本文やお手本と比べて確認しましょう。", metCriteria, requiredCriteriaCount: required.length };
    }
    if (!contradiction && metCriteria.length) {
      return { resultType: "criteria_partial", title: "関係する言葉が一つ見つかりました。本文やお手本と比べて確認しましょう。", metCriteria, requiredCriteriaCount: required.length };
    }
    return { resultType: "model_check", title: "お手本と本文を比べてみましょう", metCriteria: [], requiredCriteriaCount: required.length };
  }
  if (type === "opinion") {
    return graphemeLength(String(answer).trim()) < Number(challenge.minLength || 1)
      ? { resultType: "opinion_short", title: "自分の考えを、もう少しくわしく書いてみましょう", metCriteria: [], requiredCriteriaCount: 0 }
      : { resultType: "opinion_written", title: "自分の考えを書けました", metCriteria: [], requiredCriteriaCount: 0 };
  }
  return { resultType: "model_check", title: "お手本と比べてみましょう", metCriteria: [], requiredCriteriaCount: 0 };
}

export function validateWritingChallenge(challenge, passageBody, passageGrades = []) {
  const problems = [];
  if (!challenge || typeof challenge !== "object") return ["記述問題データがありません"];
  const type = canonicalWritingType(challenge);
  if (!String(challenge.challengeId || "").trim()) problems.push("challengeIdが空です");
  if (!["extract", "shortReason", "opinion"].includes(type)) problems.push("未対応のtypeです");
  if (!String(challenge.question || "").trim()) problems.push("questionが空です");
  if (!effectiveModelAnswers(challenge).length) problems.push("modelAnswersが空です");
  if (!String(challenge.explanation || "").trim()) problems.push("explanationが空です");
  const maxLength = Number(challenge.maxLength);
  const minLength = Number(challenge.minLength || 1);
  if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > WRITING_CHALLENGE_MAX_LENGTH) problems.push("maxLengthは1〜80にしてください");
  if (!Number.isInteger(minLength) || minLength < 1 || minLength > maxLength) problems.push("minLengthが不正です");
  if (challenge.enabled === false) problems.push("enabledがfalseです");
  const answers = Array.isArray(challenge.acceptedAnswers) ? challenge.acceptedAnswers : [];
  if (type === "extract" && !answers.length) problems.push("acceptedAnswersが空です");
  if (type === "shortReason" && !(challenge.criteria || []).length) problems.push("短文説明の評価観点が空です");
  if (type === "opinion" && !(challenge.selfChecks || []).length) problems.push("意見問題の自己確認項目が空です");
  const grades = Array.isArray(challenge.targetGrades) ? challenge.targetGrades.map(Number) : [];
  if (!grades.length || grades.some((grade) => !Number.isInteger(grade) || grade < 4 || grade > 6)) problems.push("targetGradesは4〜6年にしてください");
  if (passageGrades.length && !grades.some((grade) => passageGrades.map(Number).includes(grade))) problems.push("本文の対象学年と一致しません");
  const normalizedAnswers = answers.map(normalizeExtractAnswer);
  if (normalizedAnswers.some((answer) => !answer)) problems.push("空の正解候補があります");
  if (new Set(normalizedAnswers).size !== normalizedAnswers.length) problems.push("正解候補が重複しています");
  if (type === "extract") {
    for (const answer of answers) {
      if (graphemeLength(answer) > 20) problems.push("抜き出し正解が20文字を超えています");
      if (graphemeLength(answer) > maxLength) problems.push("正解候補がmaxLengthを超えています");
      if (!normalizeExtractAnswer(passageBody).includes(normalizeExtractAnswer(answer))) problems.push(`本文に存在しない正解候補があります: ${answer}`);
    }
    if (!normalizedAnswers.includes(normalizeExtractAnswer(challenge.modelAnswer))) problems.push("modelAnswerがacceptedAnswersに含まれていません");
  }
  for (const model of effectiveModelAnswers(challenge)) {
    if (graphemeLength(model) > maxLength) problems.push("お手本がmaxLengthを超えています");
  }
  if (challenge.evidence && !String(passageBody).includes(challenge.evidence)) problems.push("本文中の根拠が見つかりません");
  const shown = [challenge.question, challenge.modelAnswer, challenge.explanation, challenge.evidence, ...(challenge.modelAnswers || []), ...(challenge.hints || []), ...(challenge.selfChecks || [])];
  for (const value of shown) {
    if (/undefined|null|nan/iu.test(String(value ?? ""))) problems.push("不正な表示値を含みます");
    if (String(value ?? "").includes("�")) problems.push("文字化け候補を含みます");
    if (/<\s*(script|iframe|object)/iu.test(String(value ?? ""))) problems.push("危険なHTML候補を含みます");
  }
  return [...new Set(problems)];
}

export function validWritingChallenges(passage, grade, passageGrades = []) {
  if (Number(grade) < 4 || Number(grade) > 6) return [];
  return (passage?.writingChallenges || []).filter((challenge) => {
    const problems = validateWritingChallenge(challenge, passage?.body || "", passageGrades);
    if (problems.length) {
      warnInDevelopment(`記述問題を除外: ${challenge?.challengeId || "IDなし"} / ${problems.join("、")}`);
      return false;
    }
    return challenge.optional !== false && (challenge.targetGrades || []).map(Number).includes(Number(grade));
  });
}

export function toggleTapTarget(selectedTargets, target, maxLength) {
  const current = Array.isArray(selectedTargets) ? selectedTargets : [];
  const key = String(target?.id || target?.text || "");
  if (!key) return current;
  if (current.some((item) => String(item?.id || item?.text || "") === key)) {
    return current.filter((item) => String(item?.id || item?.text || "") !== key);
  }
  const next = [...current, target];
  return graphemeLength(next.map((item) => item.text || "").join("")) <= Number(maxLength || 20) ? next : current;
}
