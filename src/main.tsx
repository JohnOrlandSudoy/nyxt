import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { DailyProvider } from "@daily-co/daily-react";
import { AuthProvider } from "./components/AuthProvider";

import "./fonts/Christmas and Santona.ttf";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DailyProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </DailyProvider>
  </React.StrictMode>,
);