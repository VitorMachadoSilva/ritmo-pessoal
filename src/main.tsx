import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import App from "./App";
import "./styles.css";
import "./next.css";
import "./theme.css";
import "./auth.css";
import "./journey.css";
import "./entry-transition.css";
import "./exit-transition.css";
import "./dashboard-polish.css";
import "./routine-pagination.css";
import "./controls.css";
import "./tutorials.css";
import "./games.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
