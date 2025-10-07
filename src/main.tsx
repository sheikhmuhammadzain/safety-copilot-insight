import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(<App />);

// Remove the HTML preloader once React mounts and fonts are ready (to avoid font swap shift)
const removePreloader = () => {
  const pre = document.getElementById("app-preloader");
  if (pre) {
    pre.classList.add("fade-out");
    setTimeout(() => pre.remove(), 350);
  }
};

try {
  const anyDoc = document as any;
  if (anyDoc.fonts && typeof anyDoc.fonts.ready?.then === "function") {
    anyDoc.fonts.ready.then(() => window.requestAnimationFrame(removePreloader));
    // Fallback: don't block too long if fonts take time
    setTimeout(() => window.requestAnimationFrame(removePreloader), 1800);
  } else {
    window.requestAnimationFrame(removePreloader);
  }
} catch {
  window.requestAnimationFrame(removePreloader);
}
