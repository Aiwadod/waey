import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import MotionRoot from "./components/motion/MotionRoot.jsx";
import "./styles/waey-theme.css";

createRoot(document.getElementById("root")).render(
  <MotionRoot>
    <App />
  </MotionRoot>,
);
