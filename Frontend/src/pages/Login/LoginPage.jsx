import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSigea from "../../assets/images/logo-sigea.png";
import { api } from "../../services/api.js";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (localStorage.getItem("sigea_token")) {
      const storedUser = JSON.parse(localStorage.getItem("sigea_user") || "{}");
      navigate(storedUser.passwordResetRequired ? "/redefinir-senha" : "/home", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    if (!email.trim() || !senha) return setErro("Informe e-mail e senha para continuar.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim())) return setErro("Informe um e-mail válido.");
    setEnviando(true);
    try {
      const result = await api("/users/login", { method: "POST", body: JSON.stringify({ email, password: senha }) });
      localStorage.setItem("sigea_token", result.token);
      localStorage.setItem("sigea_user", JSON.stringify(result.user));
      if (lembrar) localStorage.setItem("sigea_email", email.trim());
      navigate(result.user.passwordResetRequired ? "/redefinir-senha" : "/home", { replace: true });
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => setEmail(localStorage.getItem("sigea_email") || ""), []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-left-panel">
          <div className="shape-circle-one" /><div className="shape-circle-two" /><div className="shape-stripe" />
          <div className="login-left-content">
            <img src={logoSigea} alt="SIGEA" className="login-logo" />
            <p className="login-tagline">Gestão inteligente de espaços acadêmicos, do planejamento à sala de aula.</p>
          </div>
          <div className="login-left-footer"><span className="login-left-footer-text">SIGEA © {new Date().getFullYear()}</span></div>
        </div>
        <div className="login-right-panel">
          <div className="login-form-wrapper">
            <p className="login-eyebrow">Acesso institucional</p>
            <h1 className="login-title">Bem-vindo de volta</h1>
            <p className="login-subtitle">Entre para consultar salas, turmas e alocações.</p>
            <form onSubmit={handleSubmit} noValidate>
              <label className="login-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" placeholder="nome@senac.br" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input" disabled={enviando} autoComplete="email" />
              <label className="login-label login-label-spaced" htmlFor="senha">Senha</label>
              <div className="login-password-wrapper">
                <input id="senha" type={mostrarSenha ? "text" : "password"} placeholder="Digite sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="login-input login-input-password" disabled={enviando} autoComplete="current-password" />
                <button type="button" onClick={() => setMostrarSenha((value) => !value)} className="login-toggle-password">{mostrarSenha ? "Ocultar" : "Mostrar"}</button>
              </div>
              {erro && <div className="login-error-box" role="alert">{erro}</div>}
              <div className="login-row-between">
                <label className="login-checkbox-label"><input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="login-checkbox" />Lembrar e-mail</label>
              </div>
              <button type="submit" disabled={enviando} className={`login-button ${enviando ? "login-button-disabled" : ""}`}>{enviando ? "Entrando..." : "Entrar"}</button>
            </form>
            <p className="login-footer-note">Acesso inicial fornecido pela administração do sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
