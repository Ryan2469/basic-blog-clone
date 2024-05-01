import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import AuthContext, { AuthContextProvider } from "components/Context/AuthContext";
import firebase from "firebaseApp";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <AuthContextProvider>
    <Router>
        <App />
    </Router>
  </AuthContextProvider>
);