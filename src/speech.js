export function canUseSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function sanitizeForSpeech(text) {
  return String(text || "")
    .replace(/［＃.*?］/g, "")
    .replace(/《.*?》/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/｜/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(text, settings = {}) {
  if (!settings.speechEnabled) return false;
  if (!canUseSpeech()) return false;
  const cleaned = sanitizeForSpeech(text);
  if (!cleaned) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = "ja-JP";
  utterance.rate = Number(settings.speechRate || 1);
  utterance.pitch = Number(settings.speechPitch || 1);
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (canUseSpeech()) window.speechSynthesis.cancel();
}

export function questionSpeech(question, isLowGrade = false) {
  const ending = isLowGrade ? "答えをえらんでください。" : "";
  return `問題。${question.question}。${ending}`;
}

export function choicesSpeech(choices, isLowGrade = false) {
  return choices.map((choice, index) => isLowGrade ? `${index + 1}ばん。${choice}` : `選択肢${index + 1}。${choice}`).join("。");
}
