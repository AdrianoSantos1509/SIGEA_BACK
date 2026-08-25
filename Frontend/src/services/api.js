const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3300";

export async function api(path, options = {}) {
  const token = localStorage.getItem("sigea_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 403 && body?.code === "PASSWORD_RESET_REQUIRED") {
      const user = JSON.parse(localStorage.getItem("sigea_user") || "{}");
      localStorage.setItem("sigea_user", JSON.stringify({ ...user, passwordResetRequired: true }));
      window.location.href = "/redefinir-senha";
    }
    if (response.status === 401 && path !== "/users/login") {
      localStorage.removeItem("sigea_token");
      localStorage.removeItem("sigea_user");
      window.location.href = "/";
    }
    const error = new Error(body?.message || "Não foi possível concluir a operação.");
    error.status = response.status;
    error.details = body;
    throw error;
  }
  return body;
}
