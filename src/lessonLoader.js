export const LESSON_FILES = [
  "./assets/lessons/kokugo_sample_lessons.json",
  "./assets/lessons/kokugo_lower_grade_expansion_lessons.json",
  "./assets/lessons/kokugo_middle_grade_expansion_lessons.json",
  "./assets/lessons/aozora_middle_grade_lessons.json",
  "./assets/lessons/aozora_upper_grade_lessons.json",
  "./assets/lessons/thinking_challenge_lessons.json"
];

export async function loadLessons() {
  const loaded = await Promise.all(
    LESSON_FILES.map(async (file) => {
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("教材を読み込めませんでした。");
        return response.json();
      } catch {
        throw new Error("初回読み込みが完了していないため、一部の教材を表示できません。もう一度インターネットに接続して開いてください。");
      }
    })
  );
  const lessons = loaded.flatMap((data) => data.lessons || []);
  return {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    lessons
  };
}

export function targetGrades(lesson) {
  if (Array.isArray(lesson.recommendedGrades) && lesson.recommendedGrades.length) {
    return [...new Set(lesson.recommendedGrades.map(Number))].sort((a, b) => a - b);
  }
  if (Array.isArray(lesson.gradeRange) && lesson.gradeRange.length >= 2) {
    const min = Math.min(...lesson.gradeRange.map(Number));
    const max = Math.max(...lesson.gradeRange.map(Number));
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }
  return [Number(lesson.grade || 1)];
}

export function isAozora(lesson) {
  const source = lesson.source || {};
  return source.provider === "青空文庫" || ["workUrl", "bookCardUrl", "textZipUrl", "xhtmlUrl"].some((key) =>
    String(source[key] || "").includes("aozora.gr.jp")
  );
}

export function lessonQuestionCount(lesson) {
  return (lesson.passages || []).reduce((total, passage) => total + (passage.questions || []).length, 0);
}

export function allQuestionRefs(lessons) {
  const refs = [];
  for (const lesson of lessons) {
    for (const passage of lesson.passages || []) {
      (passage.questions || []).forEach((question, questionIndex) => {
        refs.push({ lesson, passage, question, questionIndex });
      });
    }
  }
  return refs;
}

export function findLesson(lessons, lessonId) {
  return lessons.find((lesson) => lesson.lessonId === lessonId) || null;
}

export function findPassage(lesson, passageId) {
  return (lesson?.passages || []).find((passage) => passage.passageId === passageId) || null;
}

export function lessonBadges(lesson) {
  const badges = [];
  const grades = targetGrades(lesson);
  if (grades.length) badges.push(`小${grades[0]}${grades.length > 1 ? `〜小${grades.at(-1)}` : ""}向け`);
  if (isAozora(lesson)) badges.push("青空文庫");
  if (lesson.thinkingChallenge || String(lesson.lessonId || "").startsWith("thinking_challenge_")) {
    badges.push("思考力強化");
    badges.push("目安15分");
  }
  if (lesson.notRecommendedForLowerGrades) badges.push(`${Math.min(...grades)}年以上推奨`);
  const flags = (lesson.passages || []).flatMap((passage) =>
    (passage.questions || []).flatMap((question) => question.qualityFlags || [])
  );
  if (flags.some((flag) => ["old_language_attention", "classic_expression_value", "needs_glossary_support"].includes(flag))) {
    badges.push("古い言い回しにチャレンジ");
  }
  return badges;
}
