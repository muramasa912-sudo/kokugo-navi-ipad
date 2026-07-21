export const WRITING_CHALLENGE_MAX_LENGTH = 20;
export const LOW_GRADE_TAP_CHALLENGE_ENABLED = false;

const DEVELOPMENT_HOSTS = new Set(["", "localhost", "127.0.0.1"]);

function warnInDevelopment(message) {
  if (typeof location === "undefined" || DEVELOPMENT_HOSTS.has(location.hostname)) {
    console.warn(message);
  }
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
    .replace(/[。、，,．.!！?？]+$/gu, "")
    .trim();
}

export function isExactWritingChallengeAnswer(answer, challenge) {
  const normalized = normalizeExtractAnswer(answer);
  if (!normalized) return false;
  return (challenge?.acceptedAnswers || []).some((candidate) => normalizeExtractAnswer(candidate) === normalized);
}

export function validateWritingChallenge(challenge, passageBody, passageGrades = []) {
  const problems = [];
  if (!challenge || typeof challenge !== "object") return ["記述問題データがありません"];
  if (!String(challenge.challengeId || "").trim()) problems.push("challengeIdが空です");
  if (challenge.type !== "challengeExtract") problems.push("未対応のtypeです");
  if (!String(challenge.question || "").trim()) problems.push("questionが空です");
  if (!String(challenge.modelAnswer || "").trim()) problems.push("modelAnswerが空です");
  if (!String(challenge.explanation || "").trim()) problems.push("explanationが空です");
  const maxLength = Number(challenge.maxLength);
  if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > WRITING_CHALLENGE_MAX_LENGTH) problems.push("maxLengthが1〜20ではありません");
  const answers = Array.isArray(challenge.acceptedAnswers) ? challenge.acceptedAnswers : [];
  if (!answers.length) problems.push("acceptedAnswersが空です");
  const grades = Array.isArray(challenge.targetGrades) ? challenge.targetGrades.map(Number) : [];
  if (!grades.length || grades.some((grade) => !Number.isInteger(grade) || grade < 4 || grade > 6)) problems.push("targetGradesが4〜6年ではありません");
  if (passageGrades.length && !grades.some((grade) => passageGrades.map(Number).includes(grade))) problems.push("本文の対象学年と一致しません");
  const normalizedAnswers = answers.map(normalizeExtractAnswer);
  if (normalizedAnswers.some((answer) => !answer)) problems.push("空の正解候補があります");
  if (new Set(normalizedAnswers).size !== normalizedAnswers.length) problems.push("正解候補が重複しています");
  for (const answer of answers) {
    if (graphemeLength(answer) > WRITING_CHALLENGE_MAX_LENGTH) problems.push("20文字を超える正解候補があります");
    if (Number.isInteger(maxLength) && graphemeLength(answer) > maxLength) problems.push("maxLengthを超える正解候補があります");
    if (!normalizeExtractAnswer(passageBody).includes(normalizeExtractAnswer(answer))) problems.push(`本文に存在しない正解候補があります: ${answer}`);
  }
  if (!normalizedAnswers.includes(normalizeExtractAnswer(challenge.modelAnswer))) problems.push("modelAnswerがacceptedAnswersに含まれていません");
  for (const value of [challenge.question, challenge.modelAnswer, challenge.explanation]) {
    if (/undefined|null|nan/iu.test(String(value ?? ""))) problems.push("不正な表示値を含みます");
    if (String(value ?? "").includes("�")) problems.push("文字化け候補を含みます");
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
