import React from "react";
import ReactDOM from "react-dom/client";

import { AppRouter } from "./app/router";
import { Providers } from "./app/providers";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </React.StrictMode>
);
