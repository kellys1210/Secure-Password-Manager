import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/login_page";
import RegisterPage from "./pages/register_page";
import SetupMfaPage from "./pages/setup_mfa_page";
import VerifyMfaPage from "./pages/verify_mfa_page";
import VaultPage from "./pages/vault_page";

// Routes for current page setups.
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/setup_mfa" element={<SetupMfaPage />} />
        <Route path="/verify_mfa" element={<VerifyMfaPage />} />
        <Route path="/vault" element={<VaultPage />} />
      </Routes>
    </Router>
  );
}