import { findLesson, findPassage, isAozora, lessonBadges, lessonQuestionCount, loadLessons, targetGrades } from "./lessonLoader.js";
import { createSeed, emptyStudentProgress, filterLessons, learningTreeStage, makeDisplayQuestion, sanitizeStudentName, skillLabel, STUDY_MODES, teacherMessageForQuestion, teacherPraiseForQuestion, updateTreeProgress, withStudentName } from "./quizEngine.js";
import { answerTestQuestion, createBasicReviewTest, createBasicTest, currentTestQuestion, finishTest } from "./testMode.js";
import { questionSpeech, speak, stopSpeech, canUseSpeech } from "./speech.js";

const STORAGE_KEYS = {
  history: "kokugo_web_history",
  tests: "kokugo_web_tests",
  settings: "kokugo_web_settings",
  lastGrade: "kokugo_web_last_grade",
  onboarding: "kokugo_web_onboarding_done",
  studentName: "kokugo_student_name",
  studentProgress: "kokugo_student_progress"
};

const DEFAULT_SETTINGS = {
  studentName: "",
  teacherComments: true,
  celebrationAnimations: true,
  lastTeacherPraiseId: "",
  speechEnabled: true,
  speechRate: 1,
  speechPitch: 1
};

export async function startApp(root) {
  const catalog = await loadLessons();
  const app = new WebKokugoApp(root, catalog.lessons);
  app.render();
}

class WebKokugoApp {
  constructor(root, lessons) {
    this.root = root;
    this.lessons = lessons;
    const settings = this.readSettings();
    this.state = {
      screen: "home",
      mode: "easy",
      grade: this.readLastGrade(),
      lessonId: null,
      passageId: null,
      questionIndex: 0,
      sessionSeed: createSeed(),
      selectedIndex: null,
      correct: null,
      retryMode: false,
      usedReread: false,
      usedSpeech: false,
      showPassageAgain: false,
      testKind: "basic",
      testRereadUsed: false,
      test: null,
      testResult: null,
      resultPraise: null,
      onboardingPage: 0,
      onboardingNameDraft: settings.studentName,
      studentNameDraft: settings.studentName,
      showOnboarding: localStorage.getItem(STORAGE_KEYS.onboarding) !== "done",
      studentProgress: this.readStudentProgress(),
      treeUpdate: null,
      settings
    };
  }

  render() {
    stopSpeech();
    this.root.innerHTML = this.screenHtml();
    this.bind();
    window.scrollTo(0, 0);
  }

  screenHtml() {
    if (this.state.showOnboarding) return this.layout("はじめに", this.onboardingHtml(), false, false);
    if (this.state.screen === "home") return this.layout("小学生国語ナビ", this.homeHtml(), false);
    if (this.state.screen === "grade") return this.layout("学年を選ぶ", this.gradeHtml());
    if (this.state.screen === "works") return this.layout(STUDY_MODES[this.state.mode].title, this.worksHtml());
    if (this.state.screen === "passage") return this.layout("本文を読む", this.passageHtml());
    if (this.state.screen === "question") return this.layout("問題に答える", this.questionHtml());
    if (this.state.screen === "result") return this.layout("正誤判定", this.resultHtml());
    if (this.state.screen === "explanation") return this.layout("解説", this.explanationHtml());
    if (this.state.screen === "testGrade") return this.layout(this.state.testKind === "basicReview" ? "基礎復習コース" : "定期テスト対策コース", this.testGradeHtml());
    if (this.state.screen === "testSetup") return this.layout(this.state.testKind === "basicReview" ? "基礎復習コース" : "基本テスト", this.testSetupHtml());
    if (this.state.screen === "testQuestion") return this.layout(this.state.testKind === "basicReview" ? "基礎復習コース" : "定期テスト対策コース", this.testQuestionHtml());
    if (this.state.screen === "testResult") return this.layout("テスト結果", this.testResultHtml());
    if (this.state.screen === "reportCard") return this.layout("学習通知表", this.reportCardHtml());
    if (this.state.screen === "parentReport") return this.layout("保護者レポート", this.parentReportHtml());
    if (this.state.screen === "settings") return this.layout("設定", this.settingsHtml());
    return this.layout("小学生国語ナビ", this.homeHtml(), false);
  }

  layout(title, content, showBack = true, showSettings = true) {
    return `
      <header class="topbar">
        <div class="topbar-inner">
          ${showBack ? `<button class="ghost-button" data-action="back">戻る</button>` : `<span></span>`}
          <h1>${escapeHtml(title)}</h1>
          ${showSettings ? `<button class="ghost-button" data-action="settings">設定</button>` : `<span></span>`}
        </div>
      </header>
      <main class="page">${content}</main>
    `;
  }

  homeHtml() {
    const totalLessons = this.lessons.length;
    const totalQuestions = this.lessons.reduce((sum, lesson) => sum + lessonQuestionCount(lesson), 0);
    const history = readArray(STORAGE_KEYS.history);
    const shiori = todayShioriProgress(history);
    const learningTree = this.state.studentProgress;
    return `
      <section class="hero">
        <div>
          <h2>読む力を、毎日の少しずつで育てます。</h2>
          <p>教材はこのWebアプリ内に読み込み、iPadでも使いやすい大きな文字とボタンで表示します。</p>
          <p class="small-note">教材数 ${totalLessons}作品 / 問題数 ${totalQuestions}問</p>
          <p class="offline-note">初回読み込み後は、できるだけオフラインで利用できます。</p>
        </div>
        <img src="./assets/images/kokugo_teacher.png" alt="国語の先生" class="hero-teacher" />
      </section>
      ${this.shioriHtml(shiori)}
      ${this.learningTreeHtml(learningTree, { simple: this.state.grade <= 2 })}
      <section class="section-band">
        <h2>どれから始める？</h2>
        <div class="recommend-grid">
          ${this.recommendCard("はじめての子", "短い文章から、読む楽しさと基本を身につけます。", "easy")}
          ${this.recommendCard("読むのが苦手な子", "内容・順番・気持ち・根拠を、ゆっくり復習します。", "basicReview")}
          ${this.recommendCard("学校のテスト前", "内容理解・理由・要約をまとめて確認します。", "test")}
          ${this.recommendCard("もっと考える力を伸ばしたい子", "理由・根拠・つながりを意識して読みます。", "logical")}
          ${this.recommendCard("難しい問題に挑戦したい子", "高学年向けに、根拠・要約・主題を深く考えます。", "challenge", "小5以上推奨")}
          ${this.recommendCard("保護者の方へ", "点数だけでなく、本文に戻る・もう一度考える姿勢も確認できます。", "parent")}
        </div>
      </section>
      <section class="section-band">
        <h2>学習モードを選ぶ</h2>
      <section class="mode-grid">
        <button class="mode-card" data-action="mode" data-mode="easy">
          <strong>${escapeHtml(STUDY_MODES.easy.title)}</strong>
          <span>${escapeHtml(STUDY_MODES.easy.description)}</span>
        </button>
        <button class="mode-card gentle" data-action="basicReviewGrade">
          <strong>基礎復習コース</strong>
          <span>短い本文で、内容・順番・気持ち・根拠をゆっくり確認します。まちがえても大丈夫です。</span>
        </button>
        <button class="mode-card" data-action="mode" data-mode="logical">
          <strong>${escapeHtml(STUDY_MODES.logical.title)}</strong>
          <span>${escapeHtml(STUDY_MODES.logical.description)}</span>
        </button>
        <button class="mode-card" data-action="mode" data-mode="library">
          <strong>${escapeHtml(STUDY_MODES.library.title)}</strong>
          <span>${escapeHtml(STUDY_MODES.library.description)}</span>
        </button>
        <button class="mode-card accent" data-action="testGrade">
          <strong>定期テスト対策コース</strong>
          <span>10問の基本テストで、今の読解力を確認します。</span>
        </button>
        <button class="mode-card" data-action="mode" data-mode="challenge">
          <strong>${escapeHtml(STUDY_MODES.challenge.title)}</strong>
          <span>${escapeHtml(STUDY_MODES.challenge.description)}</span>
        </button>
        <button class="mode-card" data-action="parentReport">
          <strong>学習通知表 / 保護者レポート</strong>
          <span>点数だけではなく、がんばった形跡と次のおすすめを確認します。</span>
        </button>
      </section>
      </section>
    `;
  }

  recommendCard(title, description, target, badge = "") {
    return `
      <button class="recommend-card" data-action="recommend" data-target="${target}">
        <strong>${escapeHtml(title)}</strong>
        ${badge ? `<span class="recommend-badge">${escapeHtml(badge)}</span>` : ""}
        <span>${escapeHtml(description)}</span>
      </button>
    `;
  }

  onboardingHtml() {
    const pages = [
      ["このアプリが大切にすること", "このアプリは、点数だけでなく「本文に戻る」「もう一度考える」ことも大切にします。"],
      ["おすすめの始め方", "はじめてなら「やさしい読解」、読むのが苦手なら「基礎復習コース」から始めましょう。"],
      ["保護者の方へ", "保護者レポートでは、正解数だけでなく、がんばった形跡や家庭での声かけも確認できます。"],
      ["あなたのよび名を教えてください", "先生が、あなたの名前を呼んで応援します。本名でなくても大丈夫です。ニックネームでも使えます。"]
    ];
    const [title, message] = pages[this.state.onboardingPage] || pages[0];
    const last = this.state.onboardingPage === pages.length - 1;
    return `
      <section class="onboarding-panel">
        <img src="./assets/images/kokugo_teacher.png" alt="国語の先生" class="onboarding-teacher" />
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        ${last ? `<label class="name-field"><span>よび名</span><input type="text" maxlength="10" inputmode="text" autocomplete="nickname" placeholder="例：はる、ゆうた、さくら" value="${escapeAttr(this.state.onboardingNameDraft)}" data-action="onboardingName"></label>` : ""}
        <p class="small-note">${this.state.onboardingPage + 1} / ${pages.length}</p>
        <button class="primary-button wide" data-action="${last ? "onboardingStart" : "onboardingNext"}">${last ? "この名前ではじめる" : "次へ"}</button>
        <button class="ghost-button wide" data-action="onboardingLater">${last ? "あとで決める" : "あとで見る"}</button>
      </section>
    `;
  }

  gradeHtml() {
    const grades = [1, 2, 3, 4, 5, 6].filter((grade) => {
      if (this.state.mode === "easy") return grade <= 2;
      if (this.state.mode === "library") return grade >= 4;
      if (this.state.mode === "challenge") return grade >= 5;
      return grade >= 3;
    });
    return `
      <section class="panel">
        <p>${escapeHtml(STUDY_MODES[this.state.mode].description)}</p>
        <div class="grade-grid">
          ${grades.map((grade) => `<button class="primary-button" data-action="grade" data-grade="${grade}">小学${grade}年</button>`).join("")}
        </div>
      </section>
    `;
  }

  worksHtml() {
    const lessons = filterLessons(this.lessons, this.state.mode, this.state.grade);
    return `
      <section class="panel">
        <h2>小学${this.state.grade}年の教材</h2>
        ${lessons.length ? `<div class="lesson-list">
          ${lessons.map((lesson) => `
            <button class="lesson-card" data-action="lesson" data-lesson-id="${escapeAttr(lesson.lessonId)}" data-passage-id="${escapeAttr((lesson.passages || [])[0]?.passageId || "")}">
              <span class="lesson-title">${escapeHtml(lesson.title)}</span>
              <span class="lesson-meta">${escapeHtml(lesson.author || "オリジナル教材")} / ${lessonQuestionCount(lesson)}問</span>
              <span class="badge-row">${lessonBadges(lesson).map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</span>
            </button>
          `).join("")}
        </div>` : `<p>この条件の教材はまだありません。</p>`}
      </section>
    `;
  }

  passageHtml() {
    const { lesson, passage } = this.currentLessonPassage();
    if (!lesson || !passage) return `<section class="panel"><p>教材が見つかりません。</p></section>`;
    const isLowGrade = isLowGradeLesson(lesson);
    return `
      <section class="reading-layout">
        <article class="panel passage-panel">
          <h2>${escapeHtml(lesson.title)}</h2>
          <p class="lesson-meta">${escapeHtml(passage.displayTitle || "本文")}</p>
          ${this.sourceHtml(lesson)}
          ${isAozora(lesson) ? this.teacherCard("名作文庫の文章には、今とは少し違う言い回しが出てきます。意味を考えながら、ゆっくり読んでみましょう。") : ""}
          ${lesson.thinkingChallenge ? this.teacherCard("思考力強化モードでは、時間制限を意識しながら、本文の根拠と選択肢の違いを落ち着いて見ていきましょう。") : ""}
          <div class="passage-body">${formatBody(passage.body, passage.rubyBody)}</div>
          ${this.speechButtons([{ label: isLowGrade ? "本文をきく" : "本文を読む", text: `${passage.displayTitle || "本文"}。${passage.body}` }], isLowGrade)}
        </article>
        <aside class="panel side-panel">
          <h3>学習を始める</h3>
          <p>本文を読んだら、問題に進みましょう。</p>
          <button class="primary-button wide" data-action="startQuestions">問題へ進む</button>
        </aside>
      </section>
    `;
  }

  questionHtml() {
    const context = this.currentQuestionContext();
    if (!context) return `<section class="panel"><p>問題が見つかりません。</p></section>`;
    const { lesson, passage, question, display } = context;
    const isLowGrade = isLowGradeLesson(lesson);
    return `
      <section class="study-layout">
        <article class="panel">
          <p class="progress-text">第${this.state.questionIndex + 1}問 / 全${passage.questions.length}問</p>
          ${this.state.retryMode ? `<div class="soft-message">もう一度チャレンジです。選択肢と本文をよく比べてみましょう。</div>` : ""}
          ${this.state.showPassageAgain ? `<div class="mini-passage">${formatBody(passage.body, passage.rubyBody)}</div>` : ""}
          <button class="ghost-button inline" data-action="togglePassage">${this.state.showPassageAgain ? "問題に戻る" : "本文をもう一度読む"}</button>
          <h2>${escapeHtml(question.question)}</h2>
          ${this.speechButtons([
            { label: isLowGrade ? "問題をきく" : "問題を読む", text: questionSpeech(question, isLowGrade) },
            { label: isLowGrade ? "えらぶ文をきく" : "選択肢を読む", text: display.choices.map((choice, index) => isLowGrade ? `${index + 1}ばん。${choice}` : `選択肢${index + 1}。${choice}`).join("。") }
          ], isLowGrade)}
          <div class="choice-list">
            ${display.choices.map((choice, index) => `
              <button class="choice-button" data-action="answer" data-index="${index}">
                <span class="choice-index">${index + 1}</span>
                <span class="choice-text">${escapeHtml(choice)}</span>
              </button>
            `).join("")}
          </div>
        </article>
        <aside class="panel side-panel">
          ${this.teacherCard(teacherMessageForQuestion(question, null, this.praiseOptions(question)))}
          ${this.sourceHtml(lesson)}
        </aside>
      </section>
    `;
  }

  resultHtml() {
    const context = this.currentQuestionContext();
    if (!context) return `<section class="panel"><p>問題が見つかりません。</p></section>`;
    const { passage, question } = context;
    const praise = this.state.resultPraise || teacherPraiseForQuestion(question, this.state.correct, {
      ...this.praiseOptions(question),
      completedLesson: this.state.questionIndex + 1 === passage.questions.length,
      excludedPraiseId: this.state.settings.lastTeacherPraiseId
    });
    const teacherComment = withStudentName(
      praise.text,
      this.state.settings.studentName,
      true
    );
    const celebration = celebrationForQuestion({
      correct: this.state.correct,
      usedReread: this.state.usedReread,
      retried: this.state.retryMode,
      completedLesson: this.state.questionIndex + 1 === passage.questions.length
    });
    return `
      <section class="panel result-panel">
        ${this.celebrationHtml(celebration)}
        ${this.teacherCard(teacherComment, !this.state.correct)}
        <h2>${this.state.correct ? "正解です！" : "もう一度考えてみましょう"}</h2>
        <p>${this.state.correct ? "本文の根拠を見つけられましたね。" : "まちがえても大丈夫です。本文と選択肢をもう一度くらべてみましょう。"}</p>
        ${achievementHtml(achievementBadgesForQuestion(question, {
          correct: this.state.correct,
          usedReread: this.state.usedReread,
          retried: this.state.retryMode,
          usedSpeech: this.state.usedSpeech,
          completedLesson: this.state.questionIndex + 1 === passage.questions.length
        }))}
        ${this.learningTreeMomentHtml({
          tree: this.state.studentProgress,
          treeUpdate: this.state.treeUpdate,
          isLowGrade: isLowGradeLesson(context.lesson),
          usedReread: this.state.usedReread,
          retried: this.state.retryMode,
          completedLesson: this.state.questionIndex + 1 === passage.questions.length,
          foundEvidence: this.state.correct && (question.skillTags || []).includes("evidence"),
          usedSpeech: this.state.usedSpeech
        })}
        <div class="button-row">
          ${this.state.correct ? "" : `<button class="primary-button" data-action="retry">もう一度考える</button>`}
          <button class="primary-button" data-action="explanation">解説を見る</button>
        </div>
      </section>
    `;
  }

  explanationHtml() {
    const context = this.currentQuestionContext();
    if (!context) return `<section class="panel"><p>問題が見つかりません。</p></section>`;
    const { lesson, passage, question, display } = context;
    const isLowGrade = isLowGradeLesson(lesson);
    const answer = display.choices[display.displayAnswerIndex] || "";
    const teacherComment = withStudentName(
      teacherMessageForQuestion(question, null, this.praiseOptions(question)),
      this.state.settings.studentName,
      stableNameUse(`explanation:${question.questionId}`)
    );
    const thinkingSteps = (question.thinkingSteps || []).map((step, index) => `<li>${index + 1}. ${escapeHtml(step)}</li>`).join("");
    const reasonRows = display.choices.map((choice, index) => `
      <li><strong>${index + 1}.</strong> ${escapeHtml(choice)}<br><span>${escapeHtml(display.explanations[index] || "本文とくらべて確認しましょう。")}</span></li>
    `).join("");
    return `
      <section class="study-layout">
        <article class="panel">
          ${this.teacherCard(teacherComment)}
          <h2>解説</h2>
          <p><strong>正しい答え：</strong>${escapeHtml(answer)}</p>
          <p>${escapeHtml(question.explanation)}</p>
          <div class="evidence-box">
            <strong>本文の根拠</strong>
            <p>${escapeHtml(question.evidenceText)}</p>
          </div>
          ${logicFrameHtml(question)}
          <details>
            <summary>選択肢ごとの説明</summary>
            <ul class="reason-list">${reasonRows}</ul>
          </details>
          ${thinkingSteps ? `<details open><summary>考え方の手順</summary><ul class="reason-list">${thinkingSteps}</ul></details>` : ""}
          ${this.speechButtons([{ label: isLowGrade ? "せつめいをきく" : "解説を読む", text: `先生からのコメント。${teacherComment}。解説。${question.explanation}。本文の根拠。${question.evidenceText}` }], isLowGrade)}
          <div class="button-row">
            <button class="primary-button" data-action="nextQuestion">${this.state.questionIndex + 1 < passage.questions.length ? "次の問題へ" : "本文にもどる"}</button>
          </div>
        </article>
        <aside class="panel side-panel">${this.sourceHtml(lesson)}</aside>
      </section>
    `;
  }

  testGradeHtml() {
    const isBasicReview = this.state.testKind === "basicReview";
    return `
      <section class="panel">
        <h2>${isBasicReview ? "基礎復習コース" : "定期テスト対策コース"}</h2>
        <p>${isBasicReview ? "短い本文で、内容・順番・気持ち・根拠をゆっくり確認します。まちがえても大丈夫です。本文に戻る練習を大切にしましょう。" : "基本テストは10問、100点満点です。学年に合った問題を出します。"}</p>
        <div class="grade-grid">
          ${[1, 2, 3, 4, 5, 6].map((grade) => `<button class="primary-button" data-action="testGradeSelect" data-grade="${grade}">小学${grade}年</button>`).join("")}
        </div>
      </section>
    `;
  }

  testSetupHtml() {
    const isBasicReview = this.state.testKind === "basicReview";
    return `
      <section class="panel">
        <h2>${isBasicReview ? "基礎復習コース" : "基本テスト"}</h2>
        <p>${isBasicReview ? (this.state.grade <= 2 ? "小1〜小2は、短い本文を一つずつ読みます。点数よりも、読めたこと・本文に戻れたことを大切にします。" : "5問だけ、制限時間なしで復習します。点数よりも、読めたこと・本文に戻れたことを大切にします。") : "まずは10問で、今の読解力を確認します。解説はテストのあとでまとめて見られます。"}</p>
        <button class="primary-button wide" data-action="startTest">${isBasicReview ? "基礎復習を始める" : "基本テストを始める"}</button>
      </section>
    `;
  }

  testQuestionHtml() {
    const current = this.state.test ? currentTestQuestion(this.state.test) : null;
    if (!current) return `<section class="panel"><p>テスト問題が見つかりません。</p></section>`;
    const { ref, display } = current;
    const isLowGrade = Number(this.state.test.grade) <= 2;
    const answered = this.state.test.answers.find((answer) => answer.questionId === ref.question.questionId);
    const currentScore = Math.round((this.state.test.answers.filter((answer) => answer.correct).length * 100) / this.state.test.refs.length);
    return `
      <section class="study-layout">
        <article class="panel">
          <p class="progress-text">第${this.state.test.currentIndex + 1}問 / 全${this.state.test.refs.length}問</p>
          <p class="score-text">現在の得点 ${currentScore}点</p>
          <h2>${escapeHtml(ref.question.question)}</h2>
          ${this.speechButtons([
            { label: isLowGrade ? "問題をきく" : "問題を読む", text: questionSpeech(ref.question, isLowGrade) },
            { label: isLowGrade ? "えらぶ文をきく" : "選択肢を読む", text: display.choices.map((choice, index) => isLowGrade ? `${index + 1}ばん。${choice}` : `選択肢${index + 1}。${choice}`).join("。") }
          ], isLowGrade)}
          <div class="choice-list">
            ${display.choices.map((choice, index) => `
              <button class="choice-button ${answered?.selectedDisplayIndex === index ? "selected" : ""}" data-action="testAnswer" data-index="${index}">
                <span class="choice-index">${index + 1}</span>
                <span class="choice-text">${escapeHtml(choice)}</span>
              </button>
            `).join("")}
          </div>
          <button class="ghost-button inline" data-action="toggleTestPassage">${this.state.showPassageAgain ? "問題に戻る" : "本文をもう一度読む"}</button>
          ${this.state.showPassageAgain ? `<div class="mini-passage">${formatBody(ref.passage.body, ref.passage.rubyBody)}</div>` : ""}
          ${answered ? `<div class="soft-message">あとで先生といっしょに確認しましょう。</div><button class="primary-button wide" data-action="testNext">${this.state.test.currentIndex + 1 < this.state.test.refs.length ? "次の問題へ" : "テストを終わる"}</button>` : ""}
        </article>
      </section>
    `;
  }

  testResultHtml() {
    const result = this.state.testResult;
    if (!result) return `<section class="panel"><p>テスト結果がありません。</p></section>`;
    const teacherComment = withStudentName(result.teacherComment, this.state.settings.studentName, true);
    return `
      <section class="panel result-panel">
        ${this.celebrationHtml({ title: "ことばの花が完成", message: "さいごまでできました", centerLabel: "読", tone: "completion" })}
        ${this.teacherCard(teacherComment)}
        <h2>${result.score}点</h2>
        <p>${result.correctCount}問正解 / ${result.questionCount}問中</p>
        <p>正答率 ${result.accuracy}%</p>
        <p>苦手スキル：${result.weakSkillTags.length ? result.weakSkillTags.map(skillLabel).join("、") : "大きな偏りはありません"}</p>
        ${achievementHtml(effortBadgesForResult(result))}
        ${this.learningTreeMomentHtml({
          tree: this.state.studentProgress,
          treeUpdate: this.state.treeUpdate,
          isLowGrade: Number(result.grade) <= 2,
          usedReread: (result.questionResults || []).some((item) => item.rereadUsed),
          retried: false,
          completedLesson: true,
          foundEvidence: (result.questionResults || []).some((item) => item.correct && (item.skillTags || []).includes("evidence")),
          usedSpeech: (result.questionResults || []).some((item) => item.usedSpeech)
        })}
        <div class="button-row">
          <button class="primary-button" data-action="reportCard">学習通知表を見る</button>
          <button class="ghost-button" data-action="testGrade">もう一度テストする</button>
        </div>
      </section>
    `;
  }

  reportCardHtml() {
    const result = this.state.testResult;
    if (!result) return `<section class="panel"><p>通知表がありません。</p></section>`;
    const teacherComment = withStudentName(reportCardTeacherComment(result), this.state.settings.studentName, true);
    const learnerName = sanitizeStudentName(this.state.settings.studentName) || "学習者";
    const speechText = `学習通知表。${result.testName}。${result.score}点。${teacherComment}。保護者へのひとこと。${result.parentComment}`;
    const rereadCount = (result.questionResults || []).filter((item) => item.rereadUsed).length;
    const recommendation = recommendationForRate(result.accuracy, rereadCount);
    const skillStats = skillStatsForHistory([], [result]);
    return `
      <section class="panel report-card">
        ${this.teacherCard(teacherComment)}
        <h2>学習通知表</h2>
        <dl class="report-list">
          <dt>テスト名</dt><dd>${escapeHtml(result.testName)}</dd>
          <dt>名前</dt><dd>${escapeHtml(learnerName)}</dd>
          <dt>学年</dt><dd>小学${result.grade}年</dd>
          <dt>点数</dt><dd>${result.score}点</dd>
          <dt>正答率</dt><dd>${result.accuracy}%</dd>
          <dt>苦手スキル</dt><dd>${result.weakSkillTags.length ? result.weakSkillTags.map(skillLabel).join("、") : "大きな偏りはありません"}</dd>
          <dt>保護者向けコメント</dt><dd>${escapeHtml(result.parentComment)}</dd>
          <dt>今回よかったところ</dt><dd>${escapeHtml(effortLinesForResult(result).join(" "))}</dd>
          <dt>家庭での声かけ</dt><dd>${escapeHtml(homeSupportComment(result))}</dd>
        </dl>
        <div class="report-card-grid">
          <article class="report-summary-card"><h3>今回よかったところ</h3><p>${escapeHtml(effortLinesForResult(result).join(" "))}</p></article>
          <article class="report-summary-card"><h3>がんばった形跡</h3><p>${rereadCount ? "本文に戻って確認しようとした姿勢が見られました。" : "最後まで問題に取り組んだことが、読む力の土台になっています。"}</p></article>
          <article class="report-summary-card"><h3>次に伸ばしたい力</h3><p>${result.weakSkillTags.length ? `${escapeHtml(skillLabel(result.weakSkillTags[0]))}を、本文の言葉と結びつけて確認しましょう。` : "答えを選ぶ前に、本文のどこに書いてあるかを確認してみましょう。"}</p></article>
          <article class="report-summary-card"><h3>おすすめコース</h3><p><strong>${recommendation.name}</strong><br>${recommendation.reason}</p></article>
          <article class="report-summary-card"><h3>家庭での声かけ</h3><p>「どこを見てそう思ったの？」とやさしく聞くと、根拠を探す力が伸びやすいです。</p></article>
        </div>
        <section class="skill-report-panel">
          <h3>スキル別のようす</h3>
          ${skillStats.length ? skillBarsHtml(skillStats) : "<p>まだ記録が少ないため、次の学習からスキル別のようすを表示します。</p>"}
        </section>
        ${this.speechButtons([{ label: "通知表を読む", text: speechText }])}
      </section>
    `;
  }

  parentReportHtml() {
    const history = readArray(STORAGE_KEYS.history);
    const tests = readArray(STORAGE_KEYS.tests);
    const correctCount = history.filter((item) => item.correct).length;
    const accuracy = history.length ? Math.round((correctCount * 100) / history.length) : 0;
    const rereadCount = history.filter((item) => item.usedReread).length + tests.reduce(
      (sum, result) => sum + (result.questionResults || []).filter((item) => item.rereadUsed).length,
      0
    );
    const retryCount = history.filter((item) => item.attemptType === "再挑戦").length;
    const latest = tests.slice().sort((a, b) => Number(b.finishedAt || 0) - Number(a.finishedAt || 0))[0] || null;
    const skillStats = skillStatsForHistory(history, tests);
    const strongSkill = skillStats.filter((item) => item.attempts > 0).sort((a, b) => b.rate - a.rate)[0] || null;
    const weakSkill = skillStats.filter((item) => item.attempts > 0).sort((a, b) => a.rate - b.rate)[0] || null;
    const learningTree = this.state.studentProgress;
    const recommendation = recommendationForRate(accuracy, rereadCount);
    const safeName = sanitizeStudentName(this.state.settings.studentName);
    const namedSubject = safeName ? `${safeName}さんは、` : "";
    const effort = rereadCount > 0
      ? "答えを急がず、本文に戻って確認しようとした姿勢が見られました。"
      : retryCount > 0
        ? "もう一度考えるボタンを使い、考え直す経験ができています。"
        : history.length
          ? "最後まで問題に取り組んだことが、読む力の土台になっています。"
          : "短い本文から始められます。取り組んだことを一つずつ記録します。";
    return `
      <section class="report-overview">
        <h2>点数だけではなく、学び方も確認します</h2>
        <p>学習 ${history.length}回 / 正解 ${correctCount}問 / 正答率 ${accuracy}%${latest ? ` / 最新テスト ${latest.score}点` : ""}</p>
      </section>
      ${this.learningTreeHtml(learningTree, { simple: this.state.grade <= 2 })}
      <section class="report-card-grid">
        <article class="report-summary-card"><h3>今回よかったところ</h3><p>${escapeHtml(namedSubject)}${correctCount ? "本文の根拠を探し、正解につなげられた問題がありました。" : "点数だけではなく、問題に向き合って読み始めたことが大切です。"}</p></article>
        <article class="report-summary-card"><h3>がんばった形跡</h3><p>${effort}</p></article>
        <article class="report-summary-card"><h3>次に練習したい力</h3><p>${escapeHtml(weakSkill ? skillAdvice(weakSkill.tag) : "次は、答えを選ぶ前に本文のどこに書いてあるかを確認してみましょう。")}</p></article>
        <article class="report-summary-card"><h3>おすすめコース</h3><p><strong>${recommendation.name}</strong><br>${recommendation.reason}</p></article>
        <article class="report-summary-card"><h3>家庭での声かけ</h3><p>「どこを見てそう思ったの？」とやさしく聞くと、根拠を探す力が伸びやすいです。</p></article>
      </section>
      <section class="panel skill-report-panel">
        <h2>スキル別のようす</h2>
        ${skillStats.length ? skillBarsHtml(skillStats) : "<p>まだ記録が少ないため、もう少し学習するとスキル別のようすが見えてきます。</p>"}
        <div class="report-card-grid compact-report-grid">
          <article class="report-summary-card"><h3>得意な力</h3><p>${escapeHtml(strongSkill ? skillLabel(strongSkill.tag) : "まだ判定前です")}</p></article>
          <article class="report-summary-card"><h3>次に練習したい力</h3><p>${escapeHtml(weakSkill ? skillLabel(weakSkill.tag) : "まだ判定前です")}</p></article>
        </div>
      </section>
    `;
  }

  settingsHtml() {
    const safeName = sanitizeStudentName(this.state.settings.studentName);
    return `
      <section class="panel">
        <h2>設定</h2>
        <section class="name-setting">
          <h3>よび名を変更する</h3>
          <p>先生が呼ぶ名前を変更できます。本名でなくても大丈夫です。</p>
          <p>現在の名前：${escapeHtml(safeName || "未設定")}</p>
          <label class="name-field"><span>変更する名前</span><input type="text" maxlength="10" inputmode="text" autocomplete="nickname" placeholder="例：はる、ゆうた、さくら" value="${escapeAttr(this.state.studentNameDraft)}" data-action="settingStudentName"></label>
          <div class="button-row">
            <button class="primary-button" data-action="saveStudentName">保存</button>
            <button class="ghost-button" data-action="clearStudentName">名前を消す</button>
            <button class="ghost-button" data-action="cancelStudentName">キャンセル</button>
          </div>
        </section>
        <label class="setting-row"><span>先生コメントを表示する</span><input type="checkbox" data-action="settingTeacher" ${this.state.settings.teacherComments ? "checked" : ""}></label>
        <label class="setting-row"><span>おたのしみアニメーション</span><input type="checkbox" data-action="settingCelebration" ${this.state.settings.celebrationAnimations ? "checked" : ""}></label>
        <p class="small-note">正解や本文に戻れた時に、ことばの花がひらく演出を表示します。</p>
        <label class="setting-row"><span>読み上げを使う</span><input type="checkbox" data-action="settingSpeech" ${this.state.settings.speechEnabled ? "checked" : ""}></label>
        <label class="setting-row"><span>読み上げ速度</span><select data-action="settingRate">
          <option value="0.75" ${this.state.settings.speechRate === 0.75 ? "selected" : ""}>ゆっくり</option>
          <option value="1" ${this.state.settings.speechRate === 1 ? "selected" : ""}>ふつう</option>
          <option value="1.2" ${this.state.settings.speechRate === 1.2 ? "selected" : ""}>はやい</option>
        </select></label>
        <p class="small-note">履歴と設定は、このブラウザ内に保存します。</p>
      </section>
    `;
  }

  sourceHtml(lesson) {
    if (!isAozora(lesson) && !lesson.thinkingChallenge) return "";
    const source = lesson.source || {};
    if (lesson.thinkingChallenge) {
      return `
        <div class="source-box">
          <strong>出典：オリジナル教材</strong>
          <span>最難関中学レベルを意識した完全オリジナル問題です。</span>
          <span>実在の過去問は使用していません。</span>
        </div>
      `;
    }
    return `
      <div class="source-box">
        <strong>出典：青空文庫</strong>
        <span>作品名：${escapeHtml(lesson.title)}</span>
        <span>作者：${escapeHtml(lesson.author || "未設定")}</span>
        ${source.bookCardUrl ? `<span>図書カード：${escapeHtml(source.bookCardUrl)}</span>` : ""}
      </div>
    `;
  }

  teacherCard(message, showEncouragementImage = false) {
    if (!this.state.settings.teacherComments) return "";
    const imagePath = showEncouragementImage
      ? "./assets/images/kokugo_teacher_encourage.png"
      : "./assets/images/kokugo_teacher.png";
    const description = showEncouragementImage ? "励ましている国語の先生" : "国語の先生";
    return `
      <div class="teacher-card">
        <img src="${imagePath}" alt="${description}" />
        <div><strong>先生のポイント</strong><p>${escapeHtml(message)}</p></div>
      </div>
    `;
  }

  shioriHtml(progress) {
    return `
      <section class="shiori-card">
        <div><strong>今日のことばのしおり</strong><p>${escapeHtml(progress.message)}</p></div>
        <span>${progress.count}/${progress.goal} まい</span>
      </section>
    `;
  }

  treeVisualHtml(level, grew = false) {
    const leaves = Array.from({ length: 5 }, (_, index) => `<span class="tree-leaf leaf-${index + 1}"></span>`).join("");
    return `<div class="tree-visual tree-level-${level} ${grew ? "tree-grow" : ""}" aria-hidden="true"><span class="tree-trunk"></span>${leaves}<span class="tree-seed"></span></div>`;
  }

  learningTreeHtml(progress, options = {}) {
    const tree = progress && typeof progress === "object" ? progress : emptyStudentProgress();
    const level = Math.max(0, Math.min(10, Number(tree.treeLevel) || 0));
    const skills = Object.entries(tree.skillProgress || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 3);
    const strongest = skills[0];
    const baseMessage = strongest
      ? `あなたの木がまた育ったね。${skillLabel(strongest[0])}を探す力が強くなってきた証拠だよ。`
      : "読む・見直す・考えるたびに、学びの木が少しずつ育ちます。";
    const teacherMessage = withStudentName(baseMessage, this.state.settings.studentName, Boolean(strongest));
    const lowGradeLine = level === 0 ? "はじめの一問が、木の栄養になります。" : `葉が${Math.max(1, level)}枚ふえました。`;
    return `
      <section class="learning-tree-card">
        ${this.treeVisualHtml(level, Boolean(options.grew))}
        <div class="learning-tree-copy">
          <strong>学びの木</strong>
          <p>成長 ${level}/10 ・ ${escapeHtml(learningTreeStage(level))}</p>
          <p>${escapeHtml(options.simple ? lowGradeLine : teacherMessage)}</p>
          ${!options.simple && skills.length ? `<p class="tree-skills">${skills.map(([tag, value]) => `${escapeHtml(skillLabel(tag))} ${Math.max(0, Math.min(100, Number(value) || 0))}%`).join(" ・ ")}</p>` : ""}
        </div>
      </section>
    `;
  }

  learningTreeMomentHtml(options = {}) {
    const tree = options.tree || this.state.studentProgress || emptyStudentProgress();
    const level = Math.max(0, Math.min(10, Number(tree.treeLevel) || 0));
    const message = options.completedLesson
      ? "最後まで取り組めたので、学びの木に花がひらきました。"
      : options.usedReread
        ? "本文に戻れたので、学びの木が少し育ちました。"
        : options.retried
          ? "もう一度考えたことが、学びの木の栄養になりました。"
          : options.foundEvidence
            ? "根拠を見つけたので、学びの木に若葉がふえました。"
            : options.usedSpeech
              ? "聞いて確かめたので、学びの木が少し育ちました。"
              : "考えて答えたので、学びの木が少し育ちました。";
    return `
      <section class="learning-tree-moment">
        ${this.treeVisualHtml(level, Boolean(options.treeUpdate?.grew || options.completedLesson))}
        <div><strong>学びの木</strong><p>${escapeHtml(message)}</p></div>
        <span>成長 ${level}/10<br>${escapeHtml(learningTreeStage(level))}</span>
      </section>
    `;
  }

  celebrationHtml(celebration) {
    if (!this.state.settings.celebrationAnimations || !celebration) return "";
    return `
      <section class="word-bloom word-bloom-${escapeAttr(celebration.tone || "correct")}" aria-live="polite">
        <div class="word-flower" aria-hidden="true">
          <span class="word-petal petal-one"></span>
          <span class="word-petal petal-two"></span>
          <span class="word-petal petal-three"></span>
          <span class="word-petal petal-four"></span>
          <span class="word-petal petal-five"></span>
          <span class="word-flower-center">${escapeHtml(celebration.centerLabel || "あ")}</span>
        </div>
        <div><strong>${escapeHtml(celebration.title)}</strong><p>${escapeHtml(celebration.message)}</p></div>
      </section>
    `;
  }

  praiseOptions(question) {
    return {
      isRetry: this.state.retryMode,
      usedReread: this.state.usedReread,
      usedSpeech: this.state.usedSpeech,
      mode: this.state.mode,
      grade: this.state.grade,
      sessionSeed: this.state.sessionSeed,
      isChallenge: this.state.mode === "challenge" || Number(question?.difficulty || 1) >= 8,
      isFoundation: this.state.mode === "easy" || Number(question?.difficulty || 1) <= 3
    };
  }

  speechButtons(actions, isLowGrade = false) {
    if (!this.state.settings.speechEnabled) return "";
    if (!canUseSpeech()) return `<p class="small-note">この端末では読み上げ機能を使えません。</p>`;
    return `
      <div class="speech-row">
        ${actions.map((action) => `<button class="ghost-button" data-action="speak" data-low-grade="${isLowGrade}" data-speech-text="${escapeAttr(action.text)}">${escapeHtml(action.label)}</button>`).join("")}
        <button class="ghost-button" data-action="stopSpeech">${isLowGrade ? "とめる" : "読み上げ停止"}</button>
      </div>
    `;
  }

  bind() {
    this.root.querySelectorAll("[data-action]").forEach((element) => {
      const action = element.dataset.action;
      const eventName = action === "onboardingName" || action === "settingStudentName"
        ? "input"
        : ["settingTeacher", "settingCelebration", "settingSpeech", "settingRate"].includes(action) ? "change" : "click";
      element.addEventListener(eventName, (event) => this.handleAction(action, element, event));
    });
  }

  handleAction(action, element, event) {
    event.preventDefault();
    if (action === "onboardingName") {
      this.state.onboardingNameDraft = sanitizeStudentName(element.value);
      return;
    }
    if (action === "onboardingNext") return this.navigate({ onboardingPage: Math.min(3, this.state.onboardingPage + 1) });
    if (action === "onboardingStart" || action === "onboardingLater") {
      if (action === "onboardingStart") {
        const name = sanitizeStudentName(this.state.onboardingNameDraft);
        this.state.settings = { ...this.state.settings, studentName: name };
        this.state.studentNameDraft = name;
        localStorage.setItem(STORAGE_KEYS.studentName, name);
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.state.settings));
      }
      localStorage.setItem(STORAGE_KEYS.onboarding, "done");
      return this.navigate({ showOnboarding: false, onboardingPage: 0, screen: "home" });
    }
    if (action === "back") return this.goBack();
    if (action === "settings") return this.navigate({ screen: "settings" });
    if (action === "parentReport") return this.navigate({ screen: "parentReport" });
    if (action === "recommend") {
      const target = element.dataset.target;
      if (target === "easy") return this.navigate({ screen: "grade", mode: "easy", grade: 1 });
      if (target === "basicReview") return this.navigate({ screen: "testGrade", testKind: "basicReview" });
      if (target === "test") return this.navigate({ screen: "testGrade", testKind: "basic" });
      if (target === "logical") return this.navigate({ screen: "grade", mode: "logical", grade: 3 });
      if (target === "challenge") return this.navigate({ screen: "grade", mode: "challenge", grade: 5 });
      if (target === "parent") return this.navigate({ screen: "parentReport" });
    }
    if (action === "mode") return this.navigate({ screen: "grade", mode: element.dataset.mode, grade: defaultGradeForMode(element.dataset.mode) });
    if (action === "basicReviewGrade") return this.navigate({ screen: "testGrade", testKind: "basicReview" });
    if (action === "grade") {
      const grade = Number(element.dataset.grade);
      localStorage.setItem(STORAGE_KEYS.lastGrade, String(grade));
      return this.navigate({ screen: "works", grade });
    }
    if (action === "lesson") return this.navigate({ screen: "passage", lessonId: element.dataset.lessonId, passageId: element.dataset.passageId, questionIndex: 0 });
    if (action === "startQuestions") return this.navigate({ screen: "question", questionIndex: 0, selectedIndex: null, correct: null, retryMode: false, usedReread: false, usedSpeech: false, showPassageAgain: false, sessionSeed: createSeed() });
    if (action === "togglePassage") {
      const opening = !this.state.showPassageAgain;
      return this.navigate({ showPassageAgain: opening, usedReread: this.state.usedReread || opening });
    }
    if (action === "answer") return this.answerQuestion(Number(element.dataset.index));
    if (action === "retry") return this.navigate({ screen: "question", selectedIndex: null, correct: null, retryMode: true });
    if (action === "explanation") return this.navigate({ screen: "explanation" });
    if (action === "nextQuestion") return this.nextQuestion();
    if (action === "testGrade") return this.navigate({ screen: "testGrade", testKind: "basic" });
    if (action === "testGradeSelect") {
      const grade = Number(element.dataset.grade);
      localStorage.setItem(STORAGE_KEYS.lastGrade, String(grade));
      return this.navigate({ screen: "testSetup", grade });
    }
    if (action === "startTest") return this.startTest();
    if (action === "testAnswer") return this.answerTest(Number(element.dataset.index));
    if (action === "toggleTestPassage") {
      const opening = !this.state.showPassageAgain;
      return this.navigate({ showPassageAgain: opening, testRereadUsed: this.state.testRereadUsed || opening });
    }
    if (action === "testNext") return this.nextTestQuestion();
    if (action === "reportCard") return this.navigate({ screen: "reportCard" });
    if (action === "speak") {
      this.state.usedSpeech = true;
      const lowGradeRate = element.dataset.lowGrade === "true" && Number(this.state.settings.speechRate) === 1
        ? 0.9
        : this.state.settings.speechRate;
      return speak(element.dataset.speechText || "", { ...this.state.settings, speechRate: lowGradeRate });
    }
    if (action === "stopSpeech") return stopSpeech();
    if (action === "settingTeacher") return this.updateSettings({ teacherComments: element.checked });
    if (action === "settingCelebration") return this.updateSettings({ celebrationAnimations: element.checked });
    if (action === "settingSpeech") return this.updateSettings({ speechEnabled: element.checked });
    if (action === "settingRate") return this.updateSettings({ speechRate: Number(element.value) });
    if (action === "settingStudentName") {
      this.state.studentNameDraft = sanitizeStudentName(element.value);
      return;
    }
    if (action === "saveStudentName") return this.saveStudentName(this.state.studentNameDraft);
    if (action === "clearStudentName") return this.saveStudentName("");
    if (action === "cancelStudentName") return this.navigate({ studentNameDraft: this.state.settings.studentName });
  }

  navigate(next) {
    this.state = { ...this.state, ...next };
    this.render();
  }

  goBack() {
    if (this.state.screen === "home") return;
    const map = {
      grade: "home",
      works: "grade",
      passage: "works",
      question: "passage",
      result: "question",
      explanation: "question",
      testGrade: "home",
      testSetup: "testGrade",
      testQuestion: "testSetup",
      testResult: "testSetup",
      reportCard: "testResult",
      parentReport: "home",
      settings: "home"
    };
    this.navigate({ screen: map[this.state.screen] || "home" });
  }

  answerQuestion(selectedIndex) {
    const context = this.currentQuestionContext();
    if (!context) return;
    const originalIndex = context.display.displayToOriginal[selectedIndex];
    const correct = originalIndex === context.question.answerIndex;
    const completedLesson = this.state.questionIndex + 1 === context.passage.questions.length;
    const praise = teacherPraiseForQuestion(context.question, correct, {
      ...this.praiseOptions(context.question),
      completedLesson,
      excludedPraiseId: this.state.settings.lastTeacherPraiseId
    });
    this.rememberPraise(praise.id);
    this.saveHistory({
      questionId: context.question.questionId,
      lessonId: context.lesson.lessonId,
      passageId: context.passage.passageId,
      grade: this.state.grade,
      skillTags: context.question.skillTags || [],
      mode: this.state.mode,
      correct,
      usedReread: this.state.usedReread,
      usedSpeech: this.state.usedSpeech,
      completedPassage: completedLesson,
      attemptType: this.state.retryMode ? "再挑戦" : "初回"
    });
    const treeUpdate = this.updateStudentProgress([{
      lessonId: context.lesson.lessonId,
      skillTags: context.question.skillTags || [],
      isCorrect: correct,
      usedReread: this.state.usedReread,
      usedSpeech: this.state.usedSpeech,
      isRetry: this.state.retryMode,
      completedLesson,
      isChallenge: this.state.mode === "challenge",
      isFoundation: this.state.mode === "easy" || Number(context.question.difficulty || 1) <= 3
    }]);
    this.navigate({ screen: "result", selectedIndex, correct, resultPraise: praise, treeUpdate });
  }

  nextQuestion() {
    const context = this.currentQuestionContext();
    if (!context) return this.navigate({ screen: "passage" });
    const nextIndex = this.state.questionIndex + 1;
    if (nextIndex < context.passage.questions.length) {
      this.navigate({ screen: "question", questionIndex: nextIndex, selectedIndex: null, correct: null, retryMode: false, usedReread: false, usedSpeech: false, showPassageAgain: false, resultPraise: null, treeUpdate: null });
    } else {
      this.navigate({ screen: "passage", selectedIndex: null, correct: null, retryMode: false, usedReread: false, usedSpeech: false, showPassageAgain: false, resultPraise: null, treeUpdate: null });
    }
  }

  startTest() {
    const test = this.state.testKind === "basicReview"
      ? createBasicReviewTest(this.lessons, this.state.grade)
      : createBasicTest(this.lessons, this.state.grade);
    if (!test) return this.navigate({ screen: "testSetup" });
    this.navigate({ screen: "testQuestion", test, testResult: null, showPassageAgain: false, testRereadUsed: false, treeUpdate: null });
  }

  answerTest(index) {
    const test = answerTestQuestion(this.state.test, index, { rereadUsed: this.state.testRereadUsed, usedSpeech: this.state.usedSpeech });
    this.navigate({ test });
  }

  nextTestQuestion() {
    const test = this.state.test;
    if (!test) return;
    if (test.currentIndex + 1 < test.refs.length) {
      this.navigate({ test: { ...test, currentIndex: test.currentIndex + 1 }, showPassageAgain: false, testRereadUsed: false, usedSpeech: false });
      return;
    }
    const result = finishTest(test);
    this.saveTestResult(result);
    const treeUpdate = this.updateStudentProgress((result.questionResults || []).map((answer) => ({
      lessonId: answer.lessonId,
      skillTags: answer.skillTags || [],
      isCorrect: answer.correct,
      usedReread: answer.rereadUsed,
      usedSpeech: answer.usedSpeech,
      completedLesson: false,
      isFoundation: this.state.testKind === "basicReview"
    })));
    this.navigate({ screen: "testResult", testResult: result, treeUpdate });
  }

  currentLessonPassage() {
    const lesson = findLesson(this.lessons, this.state.lessonId);
    const passage = findPassage(lesson, this.state.passageId) || (lesson?.passages || [])[0] || null;
    return { lesson, passage };
  }

  currentQuestionContext() {
    const { lesson, passage } = this.currentLessonPassage();
    const question = (passage?.questions || [])[this.state.questionIndex];
    if (!lesson || !passage || !question) return null;
    const display = makeDisplayQuestion(question, this.state.sessionSeed);
    return { lesson, passage, question, display };
  }

  updateSettings(partial) {
    this.state.settings = { ...this.state.settings, ...partial };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.state.settings));
    this.render();
  }

  saveStudentName(value) {
    const name = sanitizeStudentName(value);
    this.state.studentNameDraft = name;
    localStorage.setItem(STORAGE_KEYS.studentName, name);
    this.updateSettings({ studentName: name });
  }

  rememberPraise(praiseId) {
    if (!praiseId) return;
    this.state.settings = { ...this.state.settings, lastTeacherPraiseId: praiseId };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.state.settings));
  }

  readSettings() {
    try {
      const saved = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}") };
      return { ...saved, studentName: sanitizeStudentName(localStorage.getItem(STORAGE_KEYS.studentName) ?? saved.studentName) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  readLastGrade() {
    const grade = Number(localStorage.getItem(STORAGE_KEYS.lastGrade) || 1);
    return Number.isInteger(grade) && grade >= 1 && grade <= 6 ? grade : 1;
  }

  readStudentProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.studentProgress) || "null");
      if (saved && typeof saved === "object") return updateTreeProgress(saved, []).progress;
    } catch {
      // A malformed local record is safely replaced by the regular history seed.
    }
    const records = readArray(STORAGE_KEYS.history);
    const tests = readArray(STORAGE_KEYS.tests);
    const seedResults = [
      ...records.map((record) => ({
        lessonId: record.lessonId,
        skillTags: record.skillTags || [],
        isCorrect: record.correct,
        usedReread: record.usedReread,
        usedSpeech: record.usedSpeech,
        isRetry: record.attemptType === "再挑戦" || record.attemptType === "retry_after_wrong",
        completedLesson: record.completedPassage
      })),
      ...tests.flatMap((test) => (test.questionResults || []).map((answer) => ({
        lessonId: answer.lessonId,
        skillTags: answer.skillTags || [],
        isCorrect: answer.correct,
        usedReread: answer.rereadUsed,
        usedSpeech: answer.usedSpeech,
        completedLesson: false
      })))
    ];
    const seeded = updateTreeProgress(emptyStudentProgress(), seedResults).progress;
    if (seedResults.length) localStorage.setItem(STORAGE_KEYS.studentProgress, JSON.stringify(seeded));
    return seeded;
  }

  updateStudentProgress(results) {
    const update = updateTreeProgress(this.state.studentProgress, results);
    this.state.studentProgress = update.progress;
    localStorage.setItem(STORAGE_KEYS.studentProgress, JSON.stringify(update.progress));
    return update;
  }

  saveHistory(record) {
    const history = readArray(STORAGE_KEYS.history);
    history.push({ ...record, answeredAt: Date.now() });
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(-500)));
  }

  saveTestResult(result) {
    const tests = readArray(STORAGE_KEYS.tests);
    tests.push(result);
    localStorage.setItem(STORAGE_KEYS.tests, JSON.stringify(tests.slice(-100)));
  }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function defaultGradeForMode(mode) {
  if (mode === "easy") return 1;
  if (mode === "library") return 4;
  if (mode === "challenge") return 5;
  return 3;
}

function stableNameUse(key) {
  let hash = 0;
  for (const character of String(key)) hash = ((hash * 31) + character.codePointAt(0)) | 0;
  return (hash & 1) === 0;
}

function recommendationForRate(accuracy, rereadCount = 0) {
  if (accuracy < 60 || rereadCount >= 3) {
    return {
      name: "基礎復習コース",
      reason: "内容・順番・根拠をゆっくり確認すると、次につながります。"
    };
  }
  if (accuracy < 85) {
    return {
      name: "論理読解",
      reason: "理由や根拠を意識して読む練習がおすすめです。"
    };
  }
  return {
    name: "思考力強化モード",
    reason: "選択肢の違いや主題を考える問題にも挑戦できます。"
  };
}

function reportCardTeacherComment(result) {
  if ((result.questionResults || []).some((item) => item.rereadUsed)) {
    return "学習通知表では、本文に戻って確認した姿勢を大切ながんばりとして記録しました。";
  }
  if ((result.weakSkillTags || []).length) {
    return `今回の通知表では、${skillLabel(result.weakSkillTags[0])}を次に伸ばす力として確認しましょう。`;
  }
  if (result.score >= 90) return "学習通知表でも、本文を根拠に答える力が安定していることが分かります。";
  return "学習通知表で、できたことと次に練習することを一緒に確認しましょう。";
}

function achievementBadgesForQuestion(question, options = {}) {
  const tags = new Set(question.skillTags || []);
  const badges = [options.completedLesson ? "さいごまでがんばった" : "考えようとした"];
  if (options.correct) {
    badges.push("よく読めました");
    if (tags.has("evidence")) badges.push("根拠みつけ名人");
  }
  if (options.usedReread) badges.push("本文にもどれた");
  if (options.retried) badges.push("もう一度考えた");
  if (options.usedSpeech) badges.push("自分に合う読み方を見つけた");
  if (["content", "character", "sequence", "feeling"].some((tag) => tags.has(tag))) {
    badges.push("本文を見つけられました");
  }
  return badges;
}

function todayShioriProgress(history) {
  const today = dayKey(Date.now());
  const records = (history || []).filter((record) => dayKey(record.answeredAt) === today);
  const labels = [];
  if (records.length) labels.push("はじめての読解");
  if (records.some((record) => record.usedReread)) labels.push("本文にもどれた");
  if (records.some((record) => record.attemptType === "再挑戦")) labels.push("もう一度考えた");
  if (records.some((record) => record.correct && (record.skillTags || []).includes("evidence"))) labels.push("根拠みつけ名人");
  if (records.some((record) => record.completedPassage)) labels.push("さいごまでがんばった");
  if (records.some((record) => record.usedSpeech)) labels.push("自分に合う読み方を見つけた");
  const count = labels.slice(0, 5).length;
  return {
    count,
    goal: 5,
    message: count === 0 ? "1問読んで、最初のしおりを作ろう。" : count >= 5 ? "今日の花が完成しました。" : "次は、本文に戻ることも大切にしてみよう。"
  };
}

function learningTreeFor(history, tests) {
  const records = Array.isArray(history) ? history : [];
  const results = Array.isArray(tests) ? tests : [];
  const skillTotals = new Map();
  for (const record of records) {
    for (const tag of record.skillTags || []) {
      const current = skillTotals.get(tag) || { attempts: 0, correct: 0 };
      current.attempts += 1;
      if (record.correct) current.correct += 1;
      skillTotals.set(tag, current);
    }
  }
  const weakTags = new Set([...skillTotals.entries()]
    .filter(([, value]) => value.attempts >= 2 && (value.correct * 100) / value.attempts < 60)
    .map(([tag]) => tag));
  const attemptPoints = records.reduce((sum, record) => sum + 1 +
    (record.completedPassage ? 3 : 0) + (record.usedReread ? 2 : 0) +
    (record.attemptType === "再挑戦" ? 2 : 0) +
    (record.correct && (record.skillTags || []).includes("evidence") ? 2 : 0) +
    (record.usedSpeech ? 1 : 0) + (record.mode === "challenge" ? 3 : 0) +
    ((record.skillTags || []).some((tag) => weakTags.has(tag)) ? 3 : 0), 0);
  const testPoints = results.reduce((sum, result) => sum + 1 +
    (result.testName === "基礎復習コース" ? 3 : 0) +
    (result.testName === "頂上チャレンジテスト" ? 3 : 0) +
    (result.questionResults || []).filter((item) => item.rereadUsed).length, 0);
  const points = attemptPoints + testPoints;
  const level = points < 8 ? 1 : points < 20 ? 2 : points < 40 ? 3 : points < 70 ? 4 : points < 110 ? 5 : 6;
  const stage = ["たね", "芽", "若葉", "小さな木", "花が咲く", "実がなる"][level - 1];
  const latest = records[records.length - 1];
  const message = latest?.usedReread
    ? "本文に戻れたので、学びの木が少し育ちました。"
    : latest?.attemptType === "再挑戦"
      ? "もう一度考えたことが、学びの木の栄養になりました。"
      : latest?.completedPassage
        ? "最後まで取り組めたので、学びの木に花がひらきました。"
        : points
          ? "今日の学びで、学びの木が少し育ちました。"
          : "読む・見直す・考えるたびに、学びの木が少しずつ育ちます。";
  return { points, level, stage, message };
}

function skillStatsForHistory(history, tests) {
  const counts = new Map();
  const record = (item, correct) => {
    for (const tag of item.skillTags || []) {
      const current = counts.get(tag) || { tag, attempts: 0, correct: 0 };
      current.attempts += 1;
      if (correct) current.correct += 1;
      counts.set(tag, current);
    }
  };
  for (const item of history || []) record(item, Boolean(item.correct));
  for (const test of tests || []) {
    for (const item of test.questionResults || []) record(item, Boolean(item.correct));
  }
  return [...counts.values()]
    .map((item) => ({ ...item, rate: Math.round((item.correct * 100) / item.attempts) }))
    .sort((a, b) => a.rate - b.rate || b.attempts - a.attempts);
}

function skillBarsHtml(stats) {
  return `<div class="skill-bars">${stats.slice(0, 6).map((item) => `
    <div class="skill-bar">
      <span>${escapeHtml(skillLabel(item.tag))}</span>
      <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${Math.max(0, Math.min(100, Number(item.rate) || 0))}%"></div></div>
      <span>${item.rate}%</span>
    </div>
  `).join("")}</div>`;
}

function skillAdvice(tag) {
  const advice = {
    evidence: "答えを選ぶ前に、本文のどこに書いてあるかを一緒に確認すると伸びやすいです。",
    reason: "「どうしてそうなったのかな？」と聞くと、理由を考える練習になります。",
    cause_effect: "原因と結果を線でつなぐように考えると、文のつながりが見えやすくなります。",
    summary: "読み終わったあとに「一番大事なことは何だった？」と短く聞くのがおすすめです。",
    theme: "文章全体で伝えたいことを一緒に短く言ってみると、主題を考える練習になります。",
    vocabulary: "分からない言葉が出た時は、前後の文から意味を予想する練習が役立ちます。"
  };
  return advice[tag] || "本文の言葉を手がかりに、答えを確かめる練習がおすすめです。";
}

function isLowGradeLesson(lesson) {
  return Math.max(...targetGrades(lesson)) <= 2;
}

function dayKey(value) {
  const date = new Date(Number(value) || 0);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function logicFrameHtml(question) {
  const tags = new Set(question.skillTags || []);
  if (Number(question.difficulty || 1) < 5 && !["summary", "theme", "choice_trap", "logical_thinking"].some((tag) => tags.has(tag))) return "";
  const steps = question.thinkingSteps || [];
  const reason = steps.find((step) => step.includes("理由") || step.includes("なぜ") || step.includes("原因")) || "本文と選択肢を比べ、理由になる文を確かめます。";
  const summary = steps[steps.length - 1] || question.explanation || "本文全体で大切なことを短くまとめます。";
  return `
    <section class="logic-frame">
      <strong>考え方の地図</strong>
      <p><b>根拠:</b> ${escapeHtml(question.evidenceText || "")}</p>
      <p><b>理由:</b> ${escapeHtml(reason)}</p>
      <p><b>まとめ:</b> ${escapeHtml(summary)}</p>
    </section>
  `;
}

function celebrationForQuestion({ correct, usedReread, retried, completedLesson }) {
  if (completedLesson) return { title: "ことばの花が完成", message: "さいごまでできました", centerLabel: "読", tone: "completion" };
  if (usedReread) return { title: "花びらがふえた", message: "本文にもどれたね", centerLabel: "本", tone: "reread" };
  if (retried) return { title: "考えなおしの芽", message: "もう一度考えられたね", centerLabel: "考", tone: "retry" };
  if (correct) return { title: "ことばの花がひらいた", message: "よく読めました", centerLabel: "あ", tone: "correct" };
  return { title: "ことばのつぼみ", message: "考えたことが力になるよ", centerLabel: "読", tone: "gentle" };
}

function effortBadgesForResult(result) {
  const badges = ["さいごまでがんばった"];
  if (result.testName === "基礎復習コース") badges.push("基礎を復習できた");
  if ((result.questionResults || []).some((item) => item.rereadUsed)) badges.push("本文にもどれた");
  if ((result.questionResults || []).some((item) => item.usedSpeech)) badges.push("音読サポートを使えた");
  if (result.correctCount > 0) badges.push("よく読めました");
  return badges;
}

function effortLinesForResult(result) {
  const lines = ["最後まで取り組めたことが大切です。"];
  if (result.testName === "基礎復習コース") {
    lines.push("短い本文で、内容・順番・気持ち・根拠をゆっくり確認できました。");
  }
  if ((result.questionResults || []).some((item) => item.rereadUsed)) {
    lines.push("答えを急がず、本文に戻って確認しようとした姿勢が見られます。");
  }
  if ((result.questionResults || []).some((item) => item.usedSpeech)) {
    lines.push("読み上げを使って、本文や問題を確認できました。自分に合った方法で読むことも大切です。");
  }
  return lines;
}

function homeSupportComment(result) {
  if (result.score >= 80) return "できた問題を一緒に喜び、選択肢を比べられたところもほめてあげてください。";
  if (result.score >= 50) return "正解できた問題があり、読解の土台が育っています。まちがえた問題は根拠の文を一緒に探すのがおすすめです。";
  return "点数だけで判断せず、最後まで取り組めたことを先に認めると、次の学習につながります。";
}

function achievementHtml(badges) {
  if (!badges || badges.length === 0) return "";
  const uniqueBadges = [...new Set(badges)];
  return `
    <div class="achievement-box">
      <strong>今日のがんばり</strong>
      <div class="badge-row">
        ${uniqueBadges.map((badge) => `<span class="badge achievement-badge">${escapeHtml(badge)}</span>`).join("")}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function formatBody(body, rubyBody = []) {
  const tokens = Array.isArray(rubyBody)
    ? rubyBody.filter((token) => token && token.text && token.ruby).sort((a, b) => String(b.text).length - String(a.text).length)
    : [];
  return String(body || "").split(/\n+/).map((paragraph) => `<p>${formatRubyParagraph(paragraph, tokens)}</p>`).join("");
}

function formatRubyParagraph(paragraph, tokens) {
  if (!tokens.length) return escapeHtml(paragraph);
  let cursor = 0;
  let rendered = "";
  while (cursor < paragraph.length) {
    let match = null;
    for (const token of tokens) {
      const index = paragraph.indexOf(String(token.text), cursor);
      if (index >= 0 && (!match || index < match.index || (index === match.index && String(token.text).length > String(match.token.text).length))) {
        match = { index, token };
      }
    }
    if (!match) {
      rendered += escapeHtml(paragraph.slice(cursor));
      break;
    }
    rendered += escapeHtml(paragraph.slice(cursor, match.index));
    rendered += `<ruby>${escapeHtml(match.token.text)}<rt>${escapeHtml(match.token.ruby)}</rt></ruby>`;
    cursor = match.index + String(match.token.text).length;
  }
  return rendered;
}
