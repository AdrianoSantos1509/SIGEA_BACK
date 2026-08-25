import { createHmac, timingSafeEqual } from "crypto";
import { AppDataSource } from "../data-source";
import { Usuario } from "../entities/usuario";
import { passwordResetRequired } from "../services/password-policy";

type TokenUser = { id: number; name: string; email: string; role: string; passwordResetRequired: boolean; passwordExpiresAt?: string | null };
type TokenPayload = TokenUser & { exp: number };

function secret() {
  return process.env.TK_PASS || "configure-o-segredo-do-token";
}

function signature(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function generateToken(user: TokenUser): string {
  const sessionExpiry = Math.floor(Date.now() / 1000) + 60 * 60 * 10;
  const passwordExpiry = user.passwordExpiresAt && !user.passwordResetRequired ? Math.floor(new Date(user.passwordExpiresAt).getTime() / 1000) : sessionExpiry;
  const payload: TokenPayload = { ...user, exp: Math.min(sessionExpiry, passwordExpiry) };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyToken(token: string): TokenPayload {
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) throw new Error("Token inválido");
  const expected = signature(encoded);
  const left = Buffer.from(suppliedSignature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Token inválido");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expirado");
  return payload;
}

export function requireAuth(req: any, res: any, next: any) {
  try {
    const authorization = String(req.headers.authorization || "");
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    req.user = verifyToken(token);
    next();
  } catch (error: any) {
    res.status(401).json({ message: error.message || "Não autorizado" });
  }
}

export async function requirePasswordCurrent(req: any, res: any, next: any) {
  try {
    const user = await AppDataSource.getRepository(Usuario).findOneBy({ id: Number(req.user?.id), active: true });
    if (!user) return res.status(401).json({ message: "Usuário inativo ou inexistente" });
    if (passwordResetRequired(user)) return res.status(403).json({ message: "Redefina sua senha para continuar", code: "PASSWORD_RESET_REQUIRED" });
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: any, res: any, next: any) {
  if (req.user?.role !== "ADMIN") return res.status(403).json({ message: "Apenas administradores podem realizar esta operação" });
  next();
}

export function requireManager(req: any, res: any, next: any) {
  if (!["ADMIN", "COORDENADOR"].includes(req.user?.role)) return res.status(403).json({ message: "Seu perfil possui acesso somente de leitura" });
  next();
}
