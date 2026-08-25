import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSigea from "../../assets/images/logo-sigea.png";
import { api } from "../../services/api.js";
import "./PasswordPage.css";

export default function PasswordPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sigea_user") || "{}");
  const forced = user.passwordResetRequired === true;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function logout() {
    localStorage.removeItem("sigea_token");
    localStorage.removeItem("sigea_user");
    navigate("/", { replace: true });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmation) return setError("A confirmação não corresponde à nova senha.");
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return setError("Use pelo menos 8 caracteres, com maiúscula, minúscula, número e caractere especial.");
    }
    setSaving(true);
    try {
      const result = await api("/users/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      localStorage.setItem("sigea_token", result.token);
      localStorage.setItem("sigea_user", JSON.stringify(result.user));
      navigate("/home", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return <main className="password-page"><section className="password-card">
    <img src={logoSigea} alt="SIGEA" />
    <span className="password-eyebrow">Segurança da conta</span>
    <h1>{forced ? "Redefinição obrigatória" : "Redefinir senha"}</h1>
    <p>{forced ? "Sua senha é provisória ou completou 60 dias. Crie uma nova senha para acessar o SIGEA." : "A nova senha será válida por 60 dias."}</p>
    <form onSubmit={submit}>
      <label>Senha atual<input required type={show ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label>
      <label>Nova senha<input required type={show ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label>
      <label>Confirmar nova senha<input required type={show ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /></label>
      <label className="show-password"><input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} /> Mostrar senhas</label>
      <div className="password-rules">Mínimo de 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.</div>
      {error && <div className="password-error" role="alert">{error}</div>}
      <button className="password-submit" disabled={saving}>{saving ? "Salvando..." : "Salvar nova senha"}</button>
    </form>
    <footer>{!forced && <button onClick={() => navigate("/home")}>Voltar ao painel</button>}<button onClick={logout}>Sair da conta</button></footer>
  </section></main>;
}
