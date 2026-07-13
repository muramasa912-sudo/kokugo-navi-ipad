:root {
  color-scheme: light;
  --bg: #fbfaf7;
  --panel: #ffffff;
  --text: #263238;
  --muted: #66757f;
  --line: #e3ddd3;
  --accent: #2f7d6d;
  --accent-strong: #236255;
  --accent-soft: #e7f4ef;
  --warm: #f6d365;
  --warm-soft: #fff5d4;
  --danger-soft: #fff0ef;
  --shadow: 0 8px 24px rgba(56, 48, 40, 0.08);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-size: 18px;
  line-height: 1.75;
}

button,
select,
input {
  font: inherit;
}

button {
  touch-action: manipulation;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(251, 250, 247, 0.94);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(10px);
}

.topbar-inner {
  display: grid;
  grid-template-columns: 96px 1fr 96px;
  align-items: center;
  gap: 12px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 12px 20px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

h1 {
  margin: 0;
  text-align: center;
  font-size: clamp(20px, 3vw, 28px);
}

h2 {
  font-size: clamp(24px, 4vw, 36px);
  line-height: 1.35;
}

.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 20px 56px;
}

.hero,
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 180px);
  gap: 20px;
  align-items: center;
  padding: clamp(20px, 4vw, 36px);
}

.hero-teacher {
  width: min(180px, 28vw);
  justify-self: center;
}

.panel {
  padding: clamp(18px, 3vw, 28px);
}

.section-band {
  margin-top: 28px;
}

.section-band > h2 {
  font-size: clamp(22px, 3vw, 30px);
}

.recommend-grid,
.report-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.recommend-card,
.report-summary-card {
  min-height: 112px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  text-align: left;
}

.recommend-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 12px;
  cursor: pointer;
}

.recommend-card > span:last-child {
  grid-column: 1 / -1;
  color: var(--muted);
}

.recommend-badge {
  align-self: start;
  color: var(--accent-strong);
  font-size: 0.85rem;
  font-weight: 700;
}

.onboarding-panel {
  max-width: 680px;
  margin: 6vh auto 0;
  padding: clamp(22px, 5vw, 40px);
  text-align: center;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.onboarding-teacher {
  width: min(160px, 36vw);
  margin-bottom: 16px;
}

.onboarding-panel .ghost-button {
  margin-top: 10px;
}

.report-overview {
  margin-bottom: 18px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}

.report-summary-card h3 {
  margin-bottom: 8px;
  color: var(--accent-strong);
}

.report-summary-card p {
  margin-bottom: 0;
}

.mode-grid,
.grade-grid,
.lesson-list,
.choice-list,
.button-row,
.speech-row,
.badge-row {
  display: grid;
  gap: 12px;
}

.mode-grid {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  margin-top: 18px;
}

.grade-grid {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.lesson-list,
.choice-list {
  grid-template-columns: 1fr;
}

.button-row,
.speech-row,
.badge-row {
  grid-template-columns: repeat(auto-fit, minmax(150px, max-content));
  align-items: center;
}

.mode-card,
.lesson-card,
.choice-button,
.primary-button,
.ghost-button {
  min-height: 52px;
  border-radius: 8px;
  border: 1px solid var(--line);
  cursor: pointer;
}

.mode-card,
.lesson-card,
.choice-button {
  background: var(--panel);
  color: var(--text);
  text-align: left;
  padding: 18px;
}

.mode-card strong,
.lesson-title {
  display: block;
  font-size: 1.08rem;
  font-weight: 700;
}

.mode-card span,
.lesson-meta,
.small-note {
  color: var(--muted);
}

.offline-note {
  display: inline-block;
  margin-bottom: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 700;
}

.learning-tree-card,
.learning-tree-moment {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #b9d8b4;
  border-radius: 8px;
  background: #edf7e8;
}

.learning-tree-card p,
.learning-tree-moment p {
  margin: 4px 0 0;
}

.learning-tree-card > span,
.learning-tree-moment > span {
  min-width: 104px;
  text-align: center;
  color: #2e6840;
  font-weight: 700;
}

.learning-tree-copy {
  flex: 1;
  min-width: 0;
}

.tree-skills {
  color: #2e6840;
  font-size: 0.92rem;
}

.tree-visual {
  position: relative;
  flex: 0 0 76px;
  width: 76px;
  height: 88px;
  transform-origin: bottom center;
}

.tree-trunk {
  position: absolute;
  bottom: 4px;
  left: 33px;
  width: 12px;
  height: 43px;
  border-radius: 8px 8px 3px 3px;
  background: #876445;
}

.tree-leaf,
.tree-seed {
  position: absolute;
  display: block;
  border-radius: 50%;
}

.tree-seed {
  bottom: 8px;
  left: 29px;
  width: 20px;
  height: 14px;
  background: #b99b62;
}

.tree-leaf {
  width: 27px;
  height: 27px;
  background: #68a86b;
  opacity: 0;
  transform: scale(0.45);
}

.leaf-1 { left: 24px; top: 16px; }
.leaf-2 { left: 8px; top: 28px; background: #83bd76; }
.leaf-3 { right: 8px; top: 28px; background: #83bd76; }
.leaf-4 { left: 18px; top: 4px; }
.leaf-5 { right: 17px; top: 7px; }

.tree-level-1 .leaf-1,
.tree-level-2 .leaf-1,
.tree-level-3 .leaf-1,
.tree-level-4 .leaf-1,
.tree-level-5 .leaf-1,
.tree-level-6 .leaf-1,
.tree-level-7 .leaf-1,
.tree-level-8 .leaf-1,
.tree-level-9 .leaf-1,
.tree-level-10 .leaf-1 { opacity: 1; transform: scale(0.75); }

.tree-level-3 .leaf-2,
.tree-level-4 .leaf-2,
.tree-level-5 .leaf-2,
.tree-level-6 .leaf-2,
.tree-level-7 .leaf-2,
.tree-level-8 .leaf-2,
.tree-level-9 .leaf-2,
.tree-level-10 .leaf-2,
.tree-level-4 .leaf-3,
.tree-level-5 .leaf-3,
.tree-level-6 .leaf-3,
.tree-level-7 .leaf-3,
.tree-level-8 .leaf-3,
.tree-level-9 .leaf-3,
.tree-level-10 .leaf-3,
.tree-level-6 .leaf-4,
.tree-level-7 .leaf-4,
.tree-level-8 .leaf-4,
.tree-level-9 .leaf-4,
.tree-level-10 .leaf-4,
.tree-level-8 .leaf-5,
.tree-level-9 .leaf-5,
.tree-level-10 .leaf-5 { opacity: 1; transform: scale(1); }

.tree-level-8 .tree-leaf,
.tree-level-9 .tree-leaf,
.tree-level-10 .tree-leaf { background: #ef9fb2; }

.tree-grow { animation: tree-grow 420ms ease-out both; }

@keyframes tree-grow {
  from { transform: scaleY(0.76); }
  65% { transform: scaleY(1.05); }
  to { transform: scaleY(1); }
}

.learning-tree-moment {
  display: grid;
  grid-template-columns: 1fr auto;
  margin: 12px 0 0;
}

.learning-tree-moment p {
  grid-column: 1 / -1;
}

.skill-report-panel {
  margin-top: 18px;
}

.skill-bars {
  display: grid;
  gap: 10px;
}

.skill-bar {
  display: grid;
  grid-template-columns: 84px minmax(90px, 1fr) 52px;
  gap: 10px;
  align-items: center;
  font-size: 0.95rem;
}

.skill-bar-track {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e5ebe8;
}

.skill-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
}

.compact-report-grid {
  margin-top: 16px;
}

ruby rt {
  color: var(--accent-strong);
  font-size: 0.62em;
}

.mode-card.accent {
  background: var(--warm-soft);
  border-color: #efcf73;
}

.mode-card.gentle {
  background: #fff8e8;
  border-color: #efcf73;
}

.primary-button {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
  padding: 12px 18px;
  font-weight: 700;
  text-align: center;
}

.primary-button:hover {
  background: var(--accent-strong);
}

.ghost-button {
  background: #ffffff;
  color: var(--accent-strong);
  padding: 10px 14px;
  font-weight: 700;
}

.ghost-button.inline {
  margin: 0 0 16px;
}

.wide {
  width: 100%;
}

.reading-layout,
.study-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  gap: 18px;
  align-items: start;
}

.passage-body {
  font-size: 1.08rem;
  line-height: 1.95;
}

.passage-body p,
.mini-passage p {
  margin: 0 0 1em;
}

.mini-passage {
  max-height: 300px;
  overflow: auto;
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f7f2;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.teacher-card {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
  padding: 14px;
  background: var(--accent-soft);
  border: 1px solid #bfdfd5;
  border-radius: 8px;
}

.teacher-card img {
  width: 96px;
  max-width: 100%;
}

.teacher-card p {
  margin-bottom: 0;
}

.source-box,
.evidence-box,
.soft-message {
  display: grid;
  gap: 4px;
  margin: 14px 0;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: #f9fbfb;
}

.evidence-box {
  background: var(--warm-soft);
}

.soft-message {
  background: var(--danger-soft);
}

.choice-button {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  min-height: 56px;
  height: auto;
  padding: 12px 14px;
  align-items: flex-start;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  line-height: 1.55;
}

.choice-index {
  align-self: flex-start;
}

.choice-text {
  min-width: 0;
  white-space: normal;
  overflow: visible;
  overflow-wrap: anywhere;
  word-break: normal;
}

.choice-button:hover,
.choice-button.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.choice-index {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent);
  color: #ffffff;
  font-weight: 700;
}

.progress-text,
.score-text {
  color: var(--accent-strong);
  font-weight: 700;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef0f2;
  color: #4e5a61;
  font-size: 0.9rem;
}

.achievement-box {
  margin: 18px 0;
  padding: 14px;
  border-radius: 8px;
  background: var(--warm-soft);
  border: 1px solid #efcf73;
}

.achievement-box strong {
  display: block;
  margin-bottom: 10px;
}

.achievement-badge {
  background: #ffffff;
  color: #5e4a12;
  font-weight: 700;
}

.shiori-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 20px 0;
  padding: 14px 16px;
  border: 1px solid #b9d7ef;
  border-radius: 8px;
  background: #eef7ff;
}

.shiori-card p {
  margin: 4px 0 0;
}

.shiori-card > span {
  flex: 0 0 auto;
  color: #1d5f89;
  font-weight: 700;
}

.logic-frame {
  margin: 18px 0;
  padding: 16px;
  border: 1px solid #d5c7ee;
  border-radius: 8px;
  background: #f7f3ff;
}

.logic-frame p {
  margin: 8px 0 0;
}

.word-bloom {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid #a9d9c1;
  border-radius: 8px;
  background: #eaf7ef;
}

.word-bloom strong {
  color: #246144;
}

.word-bloom p {
  margin: 4px 0 0;
}

.word-flower {
  position: relative;
  width: 76px;
  height: 76px;
  margin: 0 auto;
  animation: word-flower-bloom 720ms ease-out both;
}

.word-petal,
.word-flower-center {
  position: absolute;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.word-petal { animation: word-petal-open 620ms ease-out both; }
.petal-one { left: 2px; top: 23px; background: #ffc6d8; animation-delay: 40ms; }
.petal-two { left: 20px; top: 2px; background: #ffdb9c; animation-delay: 100ms; }
.petal-three { right: 4px; top: 8px; background: #cdebdd; animation-delay: 160ms; }
.petal-four { right: 1px; bottom: 18px; background: #d7e7fa; animation-delay: 220ms; }
.petal-five { left: 23px; bottom: 1px; background: #e4d4f8; animation-delay: 280ms; }

.word-flower-center {
  left: 21px;
  top: 21px;
  z-index: 1;
  background: #fff4c2;
  color: #5e4a12;
  font-weight: 700;
}

.word-bloom-gentle { border-color: #e6cf9f; background: #fff9e9; }
.word-bloom-gentle strong { color: #71551b; }

@keyframes word-flower-bloom {
  0% { opacity: 0; transform: scale(0.62); }
  68% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes word-petal-open {
  0% { opacity: 0; transform: scale(0.25); }
  100% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .word-flower,
  .word-petal,
  .tree-grow { animation: none; }
}

.reason-list {
  padding-left: 1.2em;
}

.report-list {
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr);
  gap: 10px 16px;
}

.report-list dt {
  font-weight: 700;
  color: var(--accent-strong);
}

.report-list dd {
  margin: 0;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.name-setting {
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.name-field {
  display: grid;
  gap: 8px;
  margin: 14px 0;
  font-weight: 700;
}

.name-field input {
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text);
  font: inherit;
}

@media (max-width: 760px) {
  body {
    font-size: 17px;
  }

  .topbar-inner {
    grid-template-columns: 74px 1fr 74px;
    padding: 10px 12px;
  }

  .page {
    padding: 16px 12px 44px;
  }

  .hero,
  .reading-layout,
  .study-layout {
    grid-template-columns: 1fr;
  }

  .hero-teacher {
    width: 128px;
  }

  .teacher-card {
    grid-template-columns: 72px 1fr;
  }

  .teacher-card img {
    width: 72px;
  }

  .button-row,
  .speech-row {
    grid-template-columns: 1fr;
  }

  .report-list {
    grid-template-columns: 1fr;
  }

  .recommend-grid,
  .report-card-grid {
    grid-template-columns: 1fr;
  }
}
