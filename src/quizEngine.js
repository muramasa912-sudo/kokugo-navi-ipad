import { allQuestionRefs, isAozora, targetGrades } from "./lessonLoader.js";

export const STUDY_MODES = {
  easy: {
    title: "やさしい読解モード",
    description: "短いお話を読んで、だれが何をしたか、どんな気持ちかを練習します。"
  },
  logical: {
    title: "論理読解モード",
    description: "本文のどこを見れば答えが分かるかを考える練習です。"
  },
  library: {
    title: "名作文庫モード",
    description: "青空文庫の名作を読みながら、古い言い回しや深い心情を読み取ります。"
  },
  challenge: {
    title: "思考力強化モード",
    description: "時間制限を意識しながら、根拠・要約・主題・選択肢の違いを深く考える高学年向けモードです。"
  }
};

export const SKILL_LABELS = {
  content: "内容",
  character: "登場人物",
  place: "場所",
  feeling: "気持ち",
  reason: "理由",
  vocabulary: "言葉",
  summary: "要約",
  evidence: "根拠",
  sequence: "順番",
  paragraph: "段落",
  cause_effect: "因果関係",
  contrast: "対比",
  inference: "推論",
  paraphrase: "言い換え",
  structure: "文章の組み立て",
  theme: "主題",
  choice_trap: "選択肢の見抜き",
  description_framework: "記述の組み立て",
  abstract_concrete: "抽象と具体",
  advanced_reading: "高学年読解",
  old_language_reading: "古い言い回し",
  classic_expression: "名作表現",
  classic_expression_value: "名作表現",
  context_vocabulary: "文脈で読む言葉",
  logical_thinking: "思考力強化"
};

const LOGICAL_TAGS = new Set(["evidence", "reason", "cause_effect", "contrast", "summary", "choice_trap", "logical"]);
const CHALLENGE_TAGS = new Set([
  "theme",
  "summary",
  "choice_trap",
  "description_framework",
  "abstract_concrete",
  "advanced_reading",
  "contrast",
  "logical_thinking"
]);

export const PraiseType = Object.freeze({
  CORRECT_CONFIDENCE: "CORRECT_CONFIDENCE",
  REREAD_EFFORT: "REREAD_EFFORT",
  RETRY_EFFORT: "RETRY_EFFORT",
  PERSISTENCE: "PERSISTENCE",
  EVIDENCE_FOCUS: "EVIDENCE_FOCUS",
  CAREFUL_READING: "CAREFUL_READING",
  CHALLENGE: "CHALLENGE",
  IMPROVEMENT: "IMPROVEMENT",
  FOUNDATION: "FOUNDATION",
  LISTENING_SUPPORT: "LISTENING_SUPPORT",
  GENTLE_ENCOURAGEMENT: "GENTLE_ENCOURAGEMENT"
});

const TEACHER_PRAISE_MESSAGES = [
  { id: "praise_correct_001", type: PraiseType.CORRECT_CONFIDENCE, text: "正解です。本文をよく読んで答えを選べましたね。" },
  { id: "praise_correct_002", type: PraiseType.CORRECT_CONFIDENCE, text: "よくできました。答えだけでなく、理由まで考えられています。" },
  { id: "praise_correct_003", type: PraiseType.CORRECT_CONFIDENCE, text: "いいですね。選択肢と本文を比べて考えられました。", minGrade: 3 },
  { id: "praise_correct_004", type: PraiseType.CORRECT_CONFIDENCE, text: "すばらしいです。根拠を見つける力が育っています。", skillTags: ["evidence"] },
  { id: "praise_correct_low_001", type: PraiseType.CORRECT_CONFIDENCE, text: "よく読めましたね。", maxGrade: 2 },
  { id: "praise_reread_001", type: PraiseType.REREAD_EFFORT, text: "本文に戻って確認できたところが、とても良いです。" },
  { id: "praise_reread_002", type: PraiseType.REREAD_EFFORT, text: "答えを急がず、もう一度本文を見られましたね。" },
  { id: "praise_reread_003", type: PraiseType.REREAD_EFFORT, text: "国語では、本文に戻ることが大切です。その姿勢ができています。" },
  { id: "praise_reread_004", type: PraiseType.REREAD_EFFORT, text: "もう一度読もうとしたことが、読解力につながります。" },
  { id: "praise_retry_001", type: PraiseType.RETRY_EFFORT, text: "もう一度考え直せたことが、とても大切です。" },
  { id: "praise_retry_002", type: PraiseType.RETRY_EFFORT, text: "一回で終わらせず、考え直せたところがすばらしいです。" },
  { id: "praise_retry_003", type: PraiseType.RETRY_EFFORT, text: "あきらめずに選択肢を見直せましたね。" },
  { id: "praise_retry_004", type: PraiseType.RETRY_EFFORT, text: "まちがえた後に考え直す力は、これから大きな武器になります。", minGrade: 5 },
  { id: "praise_persistence_001", type: PraiseType.PERSISTENCE, text: "最後まで取り組めたことが、とても大切です。" },
  { id: "praise_persistence_002", type: PraiseType.PERSISTENCE, text: "時間いっぱい考えられました。考えた時間も力になります。" },
  { id: "praise_evidence_001", type: PraiseType.EVIDENCE_FOCUS, text: "本文の根拠を探そうとしたところが良いです。", skillTags: ["evidence"] },
  { id: "praise_evidence_002", type: PraiseType.EVIDENCE_FOCUS, text: "根拠になる文を見つける力が、少しずつ育っています。", skillTags: ["evidence"] },
  { id: "praise_careful_001", type: PraiseType.CAREFUL_READING, text: "選択肢の違いを比べようとしたところが良いです。", minGrade: 5 },
  { id: "praise_challenge_001", type: PraiseType.CHALLENGE, text: "難しい問題に挑戦できました。それだけでも大きな一歩です。" },
  { id: "praise_challenge_002", type: PraiseType.CHALLENGE, text: "高学年向けの問題に向き合えましたね。考える力が少しずつ育っています。", minGrade: 5 },
  { id: "praise_challenge_003", type: PraiseType.CHALLENGE, text: "この問題はすぐに解けなくても大丈夫です。解説を読んで考え方を確認しましょう。" },
  { id: "praise_challenge_004", type: PraiseType.CHALLENGE, text: "選択肢の違いを考えようとしたところが良いです。", minGrade: 5 },
  { id: "praise_foundation_001", type: PraiseType.FOUNDATION, text: "基礎をていねいに復習できました。" },
  { id: "praise_foundation_002", type: PraiseType.FOUNDATION, text: "短い本文でも、根拠を見つける練習はとても大切です。" },
  { id: "praise_foundation_003", type: PraiseType.FOUNDATION, text: "ゆっくり確認できましたね。読む力の土台が育っています。" },
  { id: "praise_foundation_004", type: PraiseType.FOUNDATION, text: "基本を大事にできることは、とても良い学習です。" },
  { id: "praise_listening_001", type: PraiseType.LISTENING_SUPPORT, text: "読み上げを使って確認できました。自分に合った方法で読むことも大切です。" },
  { id: "praise_listening_002", type: PraiseType.LISTENING_SUPPORT, text: "耳で聞いて確かめる工夫ができましたね。" },
  { id: "praise_listening_003", type: PraiseType.LISTENING_SUPPORT, text: "読み上げを使って本文を確認できたことは、よい学習方法です。" },
  { id: "praise_listening_004", type: PraiseType.LISTENING_SUPPORT, text: "読む方法を自分で選べたところが良いです。" },
  { id: "praise_improvement_001", type: PraiseType.IMPROVEMENT, text: "前よりもよくできています。少しずつ力がついていますね。" },
  { id: "praise_improvement_002", type: PraiseType.IMPROVEMENT, text: "前回より正解が増えました。続けたことが力になっています。" },
  { id: "praise_improvement_003", type: PraiseType.IMPROVEMENT, text: "前よりも本文をよく見られるようになっています。" },
  { id: "praise_improvement_004", type: PraiseType.IMPROVEMENT, text: "小さな成長が見えています。この調子で進めましょう。" },
  { id: "praise_gentle_001", type: PraiseType.GENTLE_ENCOURAGEMENT, text: "まちがえても大丈夫です。考えようとしたことが学習の一歩です。" },
  { id: "praise_gentle_002", type: PraiseType.GENTLE_ENCOURAGEMENT, text: "この問題は少し難しかったですね。最後まで向き合えたことが大切です。" },
  { id: "praise_gentle_003", type: PraiseType.GENTLE_ENCOURAGEMENT, text: "答えが違っていても、本文を読もうとした時間は力になります。" },
  { id: "praise_gentle_004", type: PraiseType.GENTLE_ENCOURAGEMENT, text: "今は練習中です。少しずつ、根拠を見つける力を育てていきましょう。" }
];

export function skillLabel(tag) {
  return SKILL_LABELS[tag] || "読解";
}

export function filterLessons(lessons, mode, grade) {
  const gradeNumber = Number(grade);
  return lessons.filter((lesson) => {
    const grades = targetGrades(lesson);
    if (!grades.includes(gradeNumber)) return false;
    if (lesson.notRecommendedForLowerGrades && gradeNumber <= 2) return false;
    if (mode === "easy") return gradeNumber <= 2 && !isAozora(lesson);
    if (mode === "library") return gradeNumber >= 4 && isAozora(lesson);
    if (mode === "challenge") {
      if (gradeNumber < 5) return false;
      return lessonHasAnyTag(lesson, CHALLENGE_TAGS);
    }
    if (mode === "logical") {
      if (gradeNumber < 3) return false;
      if (isAozora(lesson) && gradeNumber <= 2) return false;
      return lessonHasAnyTag(lesson, LOGICAL_TAGS) || !isAozora(lesson);
    }
    return true;
  });
}

function lessonHasAnyTag(lesson, tags) {
  return (lesson.passages || []).some((passage) =>
    (passage.questions || []).some((question) => (question.skillTags || []).some((tag) => tags.has(tag)))
  );
}

export function createSeed() {
  return Date.now() ^ Math.floor(Math.random() * 1000000);
}

export function stableHash(text, seed) {
  let value = Number(seed) || 1;
  for (let index = 0; index < text.length; index += 1) {
    value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  }
  return value >>> 0;
}

export function shuffleWithSeed(items, seed) {
  const result = [...items];
  let state = seed >>> 0;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function makeDisplayQuestion(question, sessionSeed) {
  const explanations = question.wrongChoiceExplanations || [];
  const items = (question.choices || []).map((choice, originalIndex) => ({
    choice,
    originalIndex,
    explanation: explanations[originalIndex] || ""
  }));
  const shuffled = shuffleWithSeed(items, stableHash(question.questionId, sessionSeed));
  return {
    question,
    choices: shuffled.map((item) => item.choice),
    explanations: shuffled.map((item) => item.explanation),
    displayToOriginal: shuffled.map((item) => item.originalIndex),
    displayAnswerIndex: shuffled.findIndex((item) => item.originalIndex === question.answerIndex)
  };
}

export function buildQuestionRefsForGrade(lessons, grade) {
  const gradeNumber = Number(grade);
  return allQuestionRefs(lessons).filter(({ lesson, question }) => {
    if (!targetGrades(lesson).includes(gradeNumber)) return false;
    if (gradeNumber <= 2 && (isAozora(lesson) || lesson.notRecommendedForLowerGrades)) return false;
    if (gradeNumber <= 4 && isAozora(lesson) && !lesson.lessonId.startsWith("aozora_middle_")) return false;
    if (gradeNumber >= 5 && isAozora(lesson) && lesson.lessonId.startsWith("aozora_middle_")) return false;
    return Array.isArray(question.choices) && question.choices.length === 4;
  });
}

export function EffortScore(context = {}) {
  const isCorrect = Boolean(context.isCorrect);
  const isRetry = Boolean(context.isRetry);
  const usedReread = Boolean(context.usedReread);
  const usedSpeech = Boolean(context.usedSpeech);
  const completedLesson = Boolean(context.completedLesson);
  const isChallenge = Boolean(context.isChallenge);
  const skillTags = new Set(context.skillTags || []);
  const previousAccuracy = context.previousAccuracy;
  const currentAccuracy = context.currentAccuracy;
  const score = {
    correctScore: isCorrect ? (isRetry || isChallenge ? 3 : 2) : 0,
    rereadScore: usedReread ? (isCorrect ? 4 : 2) : 0,
    retryScore: isRetry ? 3 : 0,
    persistenceScore: completedLesson ? 3 : isCorrect ? 0 : 1,
    evidenceScore: isCorrect && skillTags.has("evidence") ? 2 : 0,
    challengeScore: isChallenge ? 3 : [...skillTags].some((tag) => CHALLENGE_TAGS.has(tag)) ? 2 : 0,
    improvementScore: typeof previousAccuracy === "number" && typeof currentAccuracy === "number" && currentAccuracy > previousAccuracy ? 4 : 0,
    listeningScore: usedSpeech ? 2 : 0,
    completionScore: completedLesson ? 3 : 0,
    carefulScore: ["reason", "cause_effect", "contrast", "choice_trap"].some((tag) => skillTags.has(tag)) ? 1 : 0
  };
  score.total = Object.values(score).reduce((sum, value) => sum + value, 0);
  return score;
}

export function emptyStudentProgress() {
  return {
    treeLevel: 0,
    skillProgress: {},
    completedLessons: [],
    lastUpdated: ""
  };
}

export function updateTreeProgress(current = emptyStudentProgress(), lessonResults = [], updatedAt = new Date().toISOString()) {
  const source = current && typeof current === "object" ? current : emptyStudentProgress();
  const skillProgress = { ...(source.skillProgress || {}) };
  let completedLessons = Array.isArray(source.completedLessons) ? [...source.completedLessons] : [];

  for (const result of lessonResults || []) {
    const tags = Array.isArray(result.skillTags) && result.skillTags.length ? result.skillTags : ["content"];
    const effort = Number.isFinite(Number(result.effortScore))
      ? Number(result.effortScore)
      : EffortScore(result).total;
    const baseGain = result.isCorrect || result.correct ? 12 : 3;
    const effortGain = Math.max(1, Math.min(6, Math.floor(Math.max(0, effort) / 3)));
    const completionGain = result.completedLesson ? 3 : 0;
    for (const tag of tags.filter(Boolean)) {
      skillProgress[tag] = Math.min(100, Math.max(0, Number(skillProgress[tag]) || 0) + baseGain + effortGain + completionGain);
    }
    if (result.completedLesson && result.lessonId) {
      completedLessons = [...new Set([...completedLessons, String(result.lessonId)])].slice(-300);
    }
  }

  const values = Object.values(skillProgress).map((value) => Math.max(0, Math.min(100, Number(value) || 0)));
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const treeLevel = Math.max(0, Math.min(10, Math.round(average / 10)));
  const progress = {
    treeLevel,
    skillProgress,
    completedLessons,
    lastUpdated: updatedAt
  };
  return { progress, grew: treeLevel > Math.max(0, Math.min(10, Number(source.treeLevel) || 0)) };
}

export function learningTreeStage(level) {
  const value = Math.max(0, Math.min(10, Number(level) || 0));
  if (value === 0) return "たね";
  if (value === 1) return "芽";
  if (value <= 3) return "若葉";
  if (value <= 5) return "小さな木";
  if (value <= 7) return "枝が広がる";
  if (value <= 9) return "花が咲く";
  return "実がなる";
}

export function praiseTypeForContext(context = {}) {
  const score = EffortScore(context);
  if (score.improvementScore > 0) return PraiseType.IMPROVEMENT;
  if (context.usedReread) return PraiseType.REREAD_EFFORT;
  if (context.isRetry) return PraiseType.RETRY_EFFORT;
  if (context.isChallenge) return PraiseType.CHALLENGE;
  if (context.isFoundation || context.mode === "basicReview") return PraiseType.FOUNDATION;
  if (context.isCorrect && (context.skillTags || []).includes("evidence")) return PraiseType.EVIDENCE_FOCUS;
  if (context.isCorrect) return PraiseType.CORRECT_CONFIDENCE;
  if (context.completedLesson) return PraiseType.PERSISTENCE;
  if (context.usedSpeech) return PraiseType.LISTENING_SUPPORT;
  return PraiseType.GENTLE_ENCOURAGEMENT;
}

export function selectTeacherPraiseMessage(question, correct = null, options = {}) {
  const skillTags = question.skillTags || [];
  const context = {
    isCorrect: correct === true,
    isRetry: Boolean(options.isRetry),
    usedReread: Boolean(options.usedReread),
    usedSpeech: Boolean(options.usedSpeech),
    completedLesson: Boolean(options.completedLesson),
    skillTags,
    mode: options.mode || "",
    grade: Number(options.grade || praiseGradeForQuestion(question)),
    attemptCount: Number(options.attemptCount || (options.isRetry ? 2 : 1)),
    previousAccuracy: options.previousAccuracy,
    currentAccuracy: options.currentAccuracy,
    isChallenge: Boolean(options.isChallenge || isChallengeQuestion(question) || options.mode === "challenge"),
    isFoundation: Boolean(options.isFoundation || Number(question.difficulty || 1) <= 3 || options.mode === "easy")
  };
  const type = praiseTypeForContext(context);
  const candidates = TEACHER_PRAISE_MESSAGES.filter((message) => {
    const minGrade = message.minGrade || 1;
    const maxGrade = message.maxGrade || 6;
    const modeOk = !message.modes || message.modes.length === 0 || message.modes.includes(context.mode);
    const tagOk = !message.skillTags || message.skillTags.length === 0 || message.skillTags.some((tag) => skillTags.includes(tag));
    return message.type === type && context.grade >= minGrade && context.grade <= maxGrade && modeOk && tagOk;
  });
  const fallback = candidates.length ? candidates : TEACHER_PRAISE_MESSAGES.filter((message) => message.type === type);
  const pool = fallback.length ? fallback : TEACHER_PRAISE_MESSAGES.filter((message) => message.type === PraiseType.GENTLE_ENCOURAGEMENT);
  const variedPool = pool.filter((message) => message.id !== options.excludedPraiseId);
  const selectablePool = variedPool.length ? variedPool : pool;
  const index = stableHash(`${question.questionId}:${type}:${context.attemptCount}:${context.usedReread}:${context.usedSpeech}:${options.sessionSeed || ""}`, selectablePool.length || 1) % selectablePool.length;
  return selectablePool[index];
}

function praiseGradeForQuestion(question) {
  const difficulty = Number(question.difficulty || 1);
  if (isChallengeQuestion(question)) return 6;
  if (difficulty <= 3) return 2;
  if (difficulty <= 5) return 4;
  return 6;
}

function isChallengeQuestion(question) {
  const tags = new Set(question.skillTags || []);
  return Number(question.difficulty || 1) >= 8 || [...tags].some((tag) => CHALLENGE_TAGS.has(tag));
}

export function teacherMessageForQuestion(question, correct = null, options = {}) {
  if (correct !== null || options.usedReread || options.isRetry || options.usedSpeech || options.completedLesson) {
    return selectTeacherPraiseMessage(question, correct, options).text;
  }
  const tags = new Set(question.skillTags || []);
  const flags = new Set(question.qualityFlags || []);
  if (flags.has("old_language_attention") || flags.has("classic_expression_value") || tags.has("old_language_reading") || tags.has("classic_expression")) {
    return "昔の言い回しは、今の言葉に置きかえると意味がつかみやすくなります。";
  }
  if (correct === true && Number(question.difficulty || 1) <= 3) {
    return "すごいです。本文をよく見られましたね。あわてずに読めたところがすばらしいです。";
  }
  if (correct === false && Number(question.difficulty || 1) <= 3) {
    return "だいじょうぶです。まちがえた問題ほど、次に力がつきます。ここまで読めたことが大切です。";
  }
  if (correct === true) return "正解です。本文の根拠をしっかり見つけられましたね。";
  if (correct === false) return "だいじょうぶです。本文のどこにヒントがあるか、もう一度見てみましょう。";
  if (Number(question.difficulty || 1) <= 3) return "まずは読めたことが大切です。短い本文でも、根拠を見つける力は育ちます。";
  if (tags.has("summary")) return "要約では、場面全体で一番大切なことを考えます。";
  if (tags.has("evidence")) return "国語では、本文の根拠を見つけることが大切です。";
  if (tags.has("feeling")) return "気持ちは、言葉だけでなく行動や会話からも読み取れます。";
  if (tags.has("reason") || tags.has("cause_effect")) return "「なぜ」と聞かれたら、原因やきっかけになる文を探しましょう。";
  return "本文をよく見て、選択肢とくらべながら考えましょう。";
}

export function teacherPraiseForQuestion(question, correct = null, options = {}) {
  if (correct !== null || options.usedReread || options.isRetry || options.usedSpeech || options.completedLesson) {
    return selectTeacherPraiseMessage(question, correct, options);
  }
  const tags = new Set(question.skillTags || []);
  const hintId = tags.has("evidence") ? "guidance_evidence" : tags.has("summary") ? "guidance_summary" : "guidance_general";
  return { id: hintId, text: teacherMessageForQuestion(question, correct, options) };
}

export function sanitizeStudentName(value) {
  const cleaned = String(value ?? "")
    .replace(/[\r\n\t]/g, "")
    .replace(/[<>{}\[\]\\/|`"']/g, "")
    .trim();
  const sanitized = [...cleaned].slice(0, 10).join("");
  return /^(null|undefined)$/i.test(sanitized) ? "" : sanitized;
}

export function withStudentName(baseComment, studentName, shouldUseName = true) {
  const safeName = sanitizeStudentName(studentName);
  return shouldUseName && safeName ? `${safeName}さん、${baseComment}` : baseComment;
}
