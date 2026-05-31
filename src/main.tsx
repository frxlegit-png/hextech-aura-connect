import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, pushSupported } from "./lib/push";

createRoot(document.getElementById("root")!).render(<App />);

// Register push service worker (no permission prompt).
if (pushSupported()) {
  registerServiceWorker();
}
