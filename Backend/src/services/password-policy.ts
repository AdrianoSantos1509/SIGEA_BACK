import { Usuario } from "../entities/usuario";

export const PASSWORD_VALIDITY_DAYS = 60;

export function getPasswordExpiresAt(changedAt: Date | null) {
  if (!changedAt) return null;
  return new Date(changedAt.getTime() + PASSWORD_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}

export function passwordResetRequired(user: Usuario) {
  const expiresAt = getPasswordExpiresAt(user.passwordChangedAt);
  return user.mustChangePassword || !expiresAt || expiresAt.getTime() <= Date.now();
}

export function validateNewPassword(password: string) {
  if (password.length < 8) throw new Error("A nova senha deve ter pelo menos 8 caracteres");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error("Use letras maiúsculas e minúsculas, número e caractere especial");
  }
}
