import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Professor } from "../entities/professor";
import { Usuario } from "../entities/usuario";
import { encryptData } from "../middleware/bcrypt.middleware";
import { requireAdmin } from "../middleware/token.middleware";
import { getPasswordExpiresAt } from "../services/password-policy";
import { isValidEmail, normalizePersonName, normalizePhone, normalizeText } from "../services/validation";

const ManagementRoutes = Router();
const asyncRoute = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next);
const allowedRoles = new Set(["ADMIN", "COORDENADOR", "CONSULTA"]);

function safeUser(user: Usuario) {
  const { password: _password, ...result } = user;
  return { ...result, passwordExpiresAt: getPasswordExpiresAt(user.passwordChangedAt)?.toISOString() || null };
}

ManagementRoutes.get("/users", requireAdmin, asyncRoute(async (_req: any, res: any) => {
  const users = await AppDataSource.getRepository(Usuario).find({ order: { name: "ASC" } });
  res.json(users.map(safeUser));
}));

ManagementRoutes.post("/users", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Usuario);
  const role = String(req.body.role || "CONSULTA").toUpperCase();
  if (!allowedRoles.has(role)) return res.status(400).json({ message: "Perfil de usuário inválido" });
  if (!req.body.name || !req.body.email || !req.body.password) return res.status(400).json({ message: "Nome, e-mail e senha são obrigatórios" });
  if (!isValidEmail(req.body.email)) return res.status(400).json({ message: "E-mail inválido" });
  if (String(req.body.password).length < 8) return res.status(400).json({ message: "A senha deve ter pelo menos 8 caracteres" });
  const user = repo.create({
    name: normalizePersonName(req.body.name),
    email: String(req.body.email).trim().toLowerCase(),
    password: encryptData(String(req.body.password)),
    role,
    regNumber: req.body.regNumber ? String(req.body.regNumber).trim() : null,
    active: req.body.active !== false,
    mustChangePassword: true,
    passwordChangedAt: null,
  });
  res.status(201).json(safeUser(await repo.save(user)));
}));

ManagementRoutes.put("/users/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Usuario);
  const user = await repo.findOneBy({ id: Number(req.params.id) });
  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
  if (Number(req.params.id) === Number(req.user.id) && req.body.active === false) return res.status(400).json({ message: "Você não pode inativar o próprio usuário" });
  if (req.body.role !== undefined) {
    const role = String(req.body.role).toUpperCase();
    if (!allowedRoles.has(role)) return res.status(400).json({ message: "Perfil de usuário inválido" });
    user.role = role;
  }
  if (req.body.name !== undefined) user.name = normalizePersonName(req.body.name);
  if (req.body.email !== undefined) { const email=String(req.body.email).trim(); if(!isValidEmail(email)) return res.status(400).json({ message: "E-mail inválido" }); user.email=email.toLowerCase(); }
  if (req.body.regNumber !== undefined) user.regNumber = req.body.regNumber ? String(req.body.regNumber).trim() : null;
  if (req.body.active !== undefined) user.active = Boolean(req.body.active);
  if (req.body.password) {
    if (String(req.body.password).length < 8) return res.status(400).json({ message: "A senha deve ter pelo menos 8 caracteres" });
    user.password = encryptData(String(req.body.password));
    user.mustChangePassword = true;
    user.passwordChangedAt = null;
  }
  res.json(safeUser(await repo.save(user)));
}));

ManagementRoutes.delete("/users/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  if (Number(req.params.id) === Number(req.user.id)) return res.status(400).json({ message: "Você não pode apagar o próprio usuário" });
  const repo = AppDataSource.getRepository(Usuario);
  const user = await repo.findOneBy({ id: Number(req.params.id) });
  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
  await repo.remove(user);
  res.status(204).send();
}));

ManagementRoutes.get("/teachers", asyncRoute(async (req: any, res: any) => {
  const qb = AppDataSource.getRepository(Professor).createQueryBuilder("teacher").orderBy("teacher.name", "ASC");
  if (req.query.search) qb.andWhere("(teacher.name LIKE :search OR teacher.registration LIKE :search OR teacher.email LIKE :search OR teacher.area LIKE :search)", { search: `%${req.query.search}%` });
  res.json(await qb.getMany());
}));

ManagementRoutes.post("/teachers", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Professor);
  if (!req.body.registration || !req.body.name) return res.status(400).json({ message: "Matrícula e nome são obrigatórios" });
  if (req.body.email && !isValidEmail(req.body.email)) return res.status(400).json({ message: "E-mail inválido" });
  let phone: string | null = null;
  try { phone = normalizePhone(req.body.phone); } catch (error: any) { return res.status(400).json({ message: error.message }); }
  const teacher = repo.create({
    registration: String(req.body.registration).trim().toUpperCase(), name: normalizePersonName(req.body.name),
    email: req.body.email ? String(req.body.email).trim().toLowerCase() : null, phone,
    area: req.body.area ? normalizeText(req.body.area) : null, specialty: req.body.specialty ? normalizeText(req.body.specialty) : null,
    notes: req.body.notes ? normalizeText(req.body.notes) : null, active: req.body.active !== false,
  });
  res.status(201).json(await repo.save(teacher));
}));

ManagementRoutes.put("/teachers/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Professor);
  const teacher = await repo.findOneBy({ id: Number(req.params.id) });
  if (!teacher) return res.status(404).json({ message: "Instrutor não encontrado" });
  for (const key of ["registration", "name", "email", "phone", "area", "specialty", "notes"]) {
    if (req.body[key] !== undefined) (teacher as any)[key] = req.body[key] ? String(req.body[key]).trim() : null;
  }
  if (req.body.area !== undefined) teacher.area = req.body.area ? normalizeText(req.body.area) : null;
  if (req.body.specialty !== undefined) teacher.specialty = req.body.specialty ? normalizeText(req.body.specialty) : null;
  if (req.body.notes !== undefined) teacher.notes = req.body.notes ? normalizeText(req.body.notes) : null;
  if (req.body.name !== undefined) teacher.name = normalizePersonName(req.body.name);
  if (req.body.email !== undefined) { const email=String(req.body.email || "").trim(); if(email && !isValidEmail(email)) return res.status(400).json({ message: "E-mail inválido" }); teacher.email=email?email.toLowerCase():null; }
  if (req.body.phone !== undefined) { try { teacher.phone=normalizePhone(req.body.phone); } catch(error:any) { return res.status(400).json({ message: error.message }); } }
  if (req.body.active !== undefined) teacher.active = Boolean(req.body.active);
  teacher.registration = String(teacher.registration).trim().toUpperCase();
  res.json(await repo.save(teacher));
}));

ManagementRoutes.delete("/teachers/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Professor);
  const teacher = await repo.findOneBy({ id: Number(req.params.id) });
  if (!teacher) return res.status(404).json({ message: "Instrutor não encontrado" });
  await repo.remove(teacher);
  res.status(204).send();
}));

export { ManagementRoutes };
