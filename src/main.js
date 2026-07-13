import { startApp } from "./app.js";

const root = document.getElementById("app");

startApp(root).catch((error) => {
  root.innerHTML = `
    <main class="page">
      <section class="panel">
        <h1>教材を読み込めませんでした</h1>
        <p>${error?.message || "初回読み込みが完了していないため、一部の教材を表示できません。もう一度インターネットに接続して開いてください。"}</p>
      </section>
    </main>
  `;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      console.info("オフライン準備は次回もう一度試します。");
    });
  });
}
