import { buildQuestionRefsForGrade, createSeed, makeDisplayQuestion, selectTeacherPraiseMessage, shuffleWithSeed, stableHash } from "./quizEngine.js";
import { allQuestionRefs, isAozora, targetGrades } from "./lessonLoader.js";
import { parentComment, scoreLabel, teacherComment, weakSkillTags } from "./reportCard.js";

export function createBasicTest(lessons, grade) {
  const refs = buildQuestionRefsForGrade(lessons, grade);
  const seed = createSeed();
  const selected = shuffleWithSeed(refs, stableHash(`test-${grade}`, seed)).slice(0, 10);
  if (selected.length < 10) return null;
  return {
    testId: `web_test_${Date.now()}`,
    name: "基本テスト",
    grade,
    seed,
    refs: selected,
    currentIndex: 0,
    answers: [],
    startedAt: Date.now()
  };
}

export function createBasicReviewTest(lessons, grade) {
  const refs = buildBasicReviewRefs(lessons, grade);
  const seed = createSeed();
  const basicRefs = refs.filter(isBasicReviewRef);
  const selected = shuffleWithSeed(basicRefs, stableHash(`basic-review-${grade}`, seed)).slice(0, 5);
  if (selected.length < 5) return null;
  return {
    testId: `web_basic_review_${Date.now()}`,
    name: "基礎復習コース",
    grade,
    seed,
    refs: selected,
    currentIndex: 0,
    answers: [],
    startedAt: Date.now(),
    kind: "basicReview"
  };
}

function buildBasicReviewRefs(lessons, grade) {
  const gradeNumber = Number(grade);
  const allowedGrades = gradeNumber === 1 ? new Set([1]) : new Set([gradeNumber - 1, gradeNumber]);
  return allQuestionRefs(lessons)
    .filter((ref) => {
      const lessonMatches = targetGrades(ref.lesson).some((targetGrade) => allowedGrades.has(targetGrade));
      const sourceMatches = gradeNumber >= 5 || !isAozora(ref.lesson);
      const levelMatches = Number(ref.question.difficulty || 1) <= gradeNumber;
      return lessonMatches && sourceMatches && levelMatches;
    })
    .sort((left, right) =>
      Number(left.question.difficulty || 1) - Number(right.question.difficulty || 1) ||
      String(left.passage.body || "").length - String(right.passage.body || "").length ||
      String(left.question.questionId).localeCompare(String(right.question.questionId), "ja")
    );
}

function isBasicReviewRef(ref) {
  const tags = new Set(ref.question.skillTags || []);
  const flags = new Set(ref.question.qualityFlags || []);
  const preferred = ["content", "character", "place", "sequence", "feeling", "reason", "evidence", "vocabulary", "cause_effect"];
  const avoid = ["theme", "summary", "choice_trap", "description_framework", "abstract_concrete", "advanced_reading", "logical_thinking", "contrast", "old_language_reading", "classic_expression"];
  const avoidFlags = ["old_language_attention", "classic_expression_value", "needs_glossary_support"];
  const hasBasic = tags.size === 0 || preferred.some((tag) => tags.has(tag));
  const hasAdvanced = avoid.some((tag) => tags.has(tag)) || avoidFlags.some((flag) => flags.has(flag)) || Number(ref.question.difficulty || 0) >= 8;
  return hasBasic && !hasAdvanced;
}

export function currentTestQuestion(test) {
  const ref = test.refs[test.currentIndex];
  return ref ? { ref, display: makeDisplayQuestion(ref.question, test.seed) } : null;
}

export function answerTestQuestion(test, selectedDisplayIndex, options = {}) {
  const current = currentTestQuestion(test);
  if (!current) return test;
  const originalIndex = current.display.displayToOriginal[selectedDisplayIndex];
  const correct = originalIndex === current.ref.question.answerIndex;
  const answer = {
    questionId: current.ref.question.questionId,
    lessonId: current.ref.lesson.lessonId,
    passageId: current.ref.passage.passageId,
    selectedDisplayIndex,
    selectedOriginalIndex: originalIndex,
    correct,
    skillTags: current.ref.question.skillTags || [],
    rereadUsed: Boolean(options.rereadUsed),
    usedSpeech: Boolean(options.usedSpeech)
  };
  return {
    ...test,
    answers: [...test.answers.filter((item) => item.questionId !== answer.questionId), answer]
  };
}

export function finishTest(test) {
  const correctCount = test.answers.filter((answer) => answer.correct).length;
  const questionCount = test.refs.length || 1;
  const score = Math.round((correctCount * 100) / questionCount);
  const weakTags = weakSkillTags(test.answers);
  return {
    testId: test.testId,
    testName: test.name,
    grade: test.grade,
    score,
    correctCount,
    questionCount,
    accuracy: Math.round((correctCount * 100) / questionCount),
    weakSkillTags: weakTags,
    label: scoreLabel(score),
    teacherComment: teacherComment(score, `${testPraiseText(test, score)}${effortText(test)}`),
    parentComment: parentComment(score, weakTags),
    finishedAt: Date.now(),
    questionResults: test.answers
  };
}

function testPraiseText(test, score) {
  const skillTags = [...new Set(test.answers.flatMap((answer) => answer.skillTags || []))];
  const pseudoQuestion = {
    questionId: test.testId,
    skillTags,
    difficulty: test.kind === "basicReview" ? 2 : 5
  };
  return selectTeacherPraiseMessage(pseudoQuestion, score >= 70, {
    completedLesson: test.answers.length > 0,
    usedReread: test.answers.some((answer) => answer.rereadUsed),
    usedSpeech: test.answers.some((answer) => answer.usedSpeech),
    mode: test.kind === "basicReview" ? "basicReview" : "test",
    grade: test.grade,
    currentAccuracy: score / 100,
    isFoundation: test.kind === "basicReview",
    sessionSeed: test.seed
  }).text;
}

function effortText(test) {
  if (test.kind === "basicReview") {
    return "短い本文で、内容・順番・気持ち・根拠をゆっくり確認できました。";
  }
  return "最後まで取り組めたことが、とても大切です。";
}
