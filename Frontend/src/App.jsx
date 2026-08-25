import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home/HomePage.jsx";
import LoginPage from "./pages/Login/LoginPage.jsx";
import PasswordPage from "./pages/Password/PasswordPage.jsx";

function ProtectedRoute({ children }) {
  if (!localStorage.getItem("sigea_token")) return <Navigate to="/" replace />;
  const user = JSON.parse(localStorage.getItem("sigea_user") || "{}");
  return user.passwordResetRequired ? <Navigate to="/redefinir-senha" replace /> : children;
}

function AuthenticatedRoute({ children }) { return localStorage.getItem("sigea_token") ? children : <Navigate to="/" replace />; }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/redefinir-senha" element={<AuthenticatedRoute><PasswordPage /></AuthenticatedRoute>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
