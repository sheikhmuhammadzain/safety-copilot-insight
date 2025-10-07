import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// Remove the HTML preloader once React mounts
window.requestAnimationFrame(() => {
  const pre = document.getElementById("app-preloader");
  if (pre) {
    pre.classList.add("fade-out");
    // Fully remove after transition
    setTimeout(() => pre.remove(), 350);
  }
});
