import { skillLabel } from "./quizEngine.js";

export function scoreLabel(score) {
  if (score >= 90) return "たいへんよくできました";
  if (score >= 70) return "よくできました";
  if (score >= 50) return "もう少しで安定します";
  return "ここからいっしょに伸ばしましょう";
}

export function teacherComment(score, effortText = "") {
  const effort = effortText || "最後まで取り組めたことが、とても大切です。";
  const base = score >= 90
    ? "すばらしいです。本文の根拠を見つける力がしっかりついています。"
    : score >= 70
      ? "よくがんばりました。多くの問題で、本文を手がかりに答えられています。"
      : score >= 50
        ? "最後まで取り組めたことが大切です。次は答えを選ぶ前に、どこに書いてあるか探してみましょう。"
        : "点数だけでなく、考えようとしたことが力になります。短い本文から、根拠を一つ見つける練習をしましょう。";
  return joinUniqueTeacherText(base, effort);
}

export function joinUniqueTeacherText(...parts) {
  const seenSentences = new Set();
  const seenTopics = new Set();
  const sentences = parts.flatMap((part) => String(part || "").match(/[^。！？]+[。！？]?/g) || []);
  return sentences.filter((sentence) => {
    const normalized = sentence.replace(/[\s、。！？]/g, "").replace(/とても/g, "");
    if (!normalized || seenSentences.has(normalized)) return false;
    seenSentences.add(normalized);
    const topic = teacherCommentTopic(sentence);
    if (!topic) return true;
    if (seenTopics.has(topic)) return false;
    seenTopics.add(topic);
    return true;
  }).slice(0, 4).join("");
}

function teacherCommentTopic(sentence) {
  if (sentence.includes("最後まで")) return "completion";
  if (sentence.includes("本文に戻") || sentence.includes("本文をもう一度")) return "reread";
  if (sentence.includes("考え直") || sentence.includes("もう一度考え")) return "retry";
  if (sentence.includes("読み上げ") || sentence.includes("耳で聞")) return "speech";
  if (sentence.includes("難しい問題") || sentence.includes("高学年向け")) return "challenge";
  if (sentence.includes("短い本文") || sentence.includes("基礎")) return "foundation";
  return "";
}

export function parentComment(score, weakTags = []) {
  const weak = weakTags.length ? ` 特に「${weakTags.map(skillLabel).join("」「")}」の復習がおすすめです。` : "";
  if (score >= 90) return `読解の基礎が安定しています。要約や主題の問題にも挑戦すると、さらに力が伸びそうです。${weak}`;
  if (score >= 70) return `読解の基本はよく身についています。理由や気持ちの変化を丁寧に読むと、さらに安定します。${weak}`;
  if (score >= 50) return `読む力の土台を作っている段階です。本文の根拠を探す練習を増やすと正答率が伸びやすいです。${weak}`;
  return `点数だけで判断せず、最後まで考えたことを評価してあげると次の学習につながります。${weak}`;
}

export function weakSkillTags(results) {
  const counts = new Map();
  for (const result of results) {
    if (result.correct) continue;
    for (const tag of result.skillTags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
}
