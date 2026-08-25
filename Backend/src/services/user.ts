import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Usuario } from "../entities/usuario";
import { encryptData, verifyData } from "../middleware/bcrypt.middleware";
import { generateToken } from "../middleware/token.middleware";
import { getPasswordExpiresAt, passwordResetRequired, validateNewPassword } from "./password-policy";
import { isValidEmail, normalizePersonName } from "./validation";

export class UserService {
  private readonly userRepo: Repository<Usuario>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(Usuario);
  }

  async create(name: string, password: string, email: string, regNumber?: string, role = "COORDENADOR") {
    if (!name || !password || !email) throw new Error("Nome, e-mail e senha são obrigatórios");
    if (!isValidEmail(email)) throw new Error("E-mail inválido");
    const user = this.userRepo.create({ name: normalizePersonName(name), email: email.trim().toLowerCase(), password: encryptData(password), regNumber: regNumber || null, role, mustChangePassword: true, passwordChangedAt: null });
    const saved = await this.userRepo.save(user);
    const { password: _password, ...safeUser } = saved;
    return safeUser;
  }

  async checkUser(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email: String(email || "").trim().toLowerCase(), active: true } });
    if (!user || !(await verifyData(user.password, password || ""))) return null;
    return this.authenticationResult(user);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOneBy({ id: userId, active: true });
    if (!user || !(await verifyData(user.password, currentPassword || ""))) throw new Error("A senha atual está incorreta");
    validateNewPassword(String(newPassword || ""));
    if (await verifyData(user.password, newPassword)) throw new Error("A nova senha deve ser diferente da senha atual");
    user.password = encryptData(newPassword);
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
    await this.userRepo.save(user);
    return this.authenticationResult(user);
  }

  private authenticationResult(user: Usuario) {
    const resetRequired = passwordResetRequired(user);
    const expiresAt = getPasswordExpiresAt(user.passwordChangedAt);
    const safeUser = {
      id: user.id, name: user.name, email: user.email, role: user.role,
      passwordResetRequired: resetRequired,
      passwordExpiresAt: expiresAt?.toISOString() || null,
    };
    return { token: generateToken(safeUser), user: safeUser };
  }
}
