import { Router } from "express";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { AppDataSource } from "../data-source";
import { Unidade } from "../entities/unidade";
import { Sala } from "../entities/sala";
import { Turma } from "../entities/turma";
import { Alocacao } from "../entities/alocacao";
import { Professor } from "../entities/professor";
import { requireAdmin, requireManager } from "../middleware/token.middleware";
import { normalizePersonName, normalizePhone, isValidEmail, dateIsValidRange, timeIsValidRange, onlyDigits, isValidCNPJ, isValidCEP, normalizeInstitutionName, normalizeAddress, normalizeText } from "../services/validation";

const ApiRoutes = Router();
const asyncRoute = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next);
const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function dateOnly(value: any) {
  const result = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : null;
}

function currentDateSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function timeOnly(value: any) {
  const result = String(value || "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(result) ? `${result}:00` : null;
}

function normalizeDays(value: any): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).toUpperCase()).filter((item) => weekdayLabels.includes(item)) : [];
}

function overlapsTime(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB;
}

async function instructorConflictsFor(payload: any, ignoreId?: number) {
  const teacherId = Number(payload.instructorId || payload.teacherId || payload.instructor?.id || 0);
  if (!teacherId) return [];
  const startDate = dateOnly(payload.startDate);
  const endDate = dateOnly(payload.endDate);
  const startTime = timeOnly(payload.startTime);
  const endTime = timeOnly(payload.endTime);
  const weekdays = normalizeDays(payload.weekdays);
  if (!startDate || !endDate || !startTime || !endTime || weekdays.length === 0) return [];
  const existing = await AppDataSource.getRepository(Alocacao)
    .createQueryBuilder("occupancy")
    .leftJoinAndSelect("occupancy.instructor", "instructor")
    .leftJoinAndSelect("occupancy.course", "course")
    .leftJoinAndSelect("course.teacher", "courseTeacher")
    .leftJoinAndSelect("occupancy.classroom", "classroom")
    .leftJoinAndSelect("classroom.building", "building")
    .where("occupancy.startDate <= :endDate AND occupancy.endDate >= :startDate", { startDate, endDate })
    .andWhere("occupancy.status <> 'CANCELADA'")
    .getMany();
  return existing.filter((item) => {
    if (item.id === ignoreId) return false;
    const effectiveTeacherId = item.instructor?.id || item.course?.teacher?.id;
    if (effectiveTeacherId !== teacherId) return false;
    if (!item.weekdays.some((day) => weekdays.includes(day))) return false;
    return overlapsTime(startTime, endTime, item.startTime, item.endTime);
  });
}

async function conflictsFor(payload: any, ignoreId?: number) {
  const roomId = Number(payload.classroomId || payload.classroom?.id);
  if (!roomId) return [];
  const startDate = dateOnly(payload.startDate);
  const endDate = dateOnly(payload.endDate);
  const startTime = timeOnly(payload.startTime);
  const endTime = timeOnly(payload.endTime);
  const weekdays = normalizeDays(payload.weekdays);
  if (!startDate || !endDate || !startTime || !endTime || weekdays.length === 0) return [];
  const existing = await AppDataSource.getRepository(Alocacao)
    .createQueryBuilder("occupancy")
    .leftJoinAndSelect("occupancy.classroom", "classroom")
    .leftJoinAndSelect("occupancy.course", "course")
    .where("classroom.id = :roomId", { roomId })
    .andWhere("occupancy.status <> 'CANCELADA'")
    .andWhere("occupancy.startDate <= :endDate AND occupancy.endDate >= :startDate", { startDate, endDate })
    .getMany();
  return existing.filter((item) => {
    if (item.id === ignoreId) return false;
    const sameDays = normalizeDays(item.weekdays).some((day) => weekdays.includes(day));
    if (!sameDays) return false;
    return overlapsTime(startTime, endTime, item.startTime, item.endTime);
  });
}

ApiRoutes.get("/buildings", asyncRoute(async (_req: any, res: any) => {
  const items = await AppDataSource.getRepository(Unidade).find({ order: { name: "ASC" } });
  res.json(items);
}));

ApiRoutes.post("/buildings", requireManager, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Unidade);
  const cnpjDigits = onlyDigits(req.body.cnpj ?? req.body.code);
  const name = normalizeInstitutionName(req.body.name);
  const location = normalizeAddress(req.body.location);
  const zipCode = onlyDigits(req.body.zipCode ?? req.body.cep);
  if (!cnpjDigits || !name || !location) return res.status(400).json({ message: "CNPJ, nome da instituição e endereço são obrigatórios" });
  if (!isValidCNPJ(cnpjDigits)) return res.status(400).json({ message: "CNPJ inválido" });
  if (zipCode && !isValidCEP(zipCode)) return res.status(400).json({ message: "CEP inválido" });
  const duplicate = await repo.findOneBy({ code: cnpjDigits });
  if (duplicate) return res.status(409).json({ message: "Já existe uma unidade cadastrada com esse CNPJ" });
  const item = repo.create({ code: cnpjDigits, name, location, zipCode: zipCode || null, active: req.body.active !== false });
  res.status(201).json(await repo.save(item));
}));

ApiRoutes.put("/buildings/:id", requireManager, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Unidade);
  const item = await repo.findOneBy({ id: Number(req.params.id) });
  if (!item) return res.status(404).json({ message: "Unidade não encontrada" });
  if (req.body.cnpj !== undefined || req.body.code !== undefined) {
    const cnpjDigits = onlyDigits(req.body.cnpj ?? req.body.code);
    if (!cnpjDigits) return res.status(400).json({ message: "CNPJ é obrigatório" });
    if (cnpjDigits !== item.code) {
      if (!isValidCNPJ(cnpjDigits)) return res.status(400).json({ message: "CNPJ inválido" });
      const duplicate = await repo.findOneBy({ code: cnpjDigits });
      if (duplicate) return res.status(409).json({ message: "Já existe uma unidade cadastrada com esse CNPJ" });
      item.code = cnpjDigits;
    }
  }
  if (req.body.name !== undefined) {
    const name = normalizeInstitutionName(req.body.name);
    if (!name) return res.status(400).json({ message: "Nome da instituição é obrigatório" });
    item.name = name;
  }
  if (req.body.location !== undefined) {
    const location = normalizeAddress(req.body.location);
    if (!location) return res.status(400).json({ message: "Endereço da unidade é obrigatório" });
    item.location = location;
  }
  if (req.body.zipCode !== undefined || req.body.cep !== undefined) {
    const zipCode = onlyDigits(req.body.zipCode ?? req.body.cep);
    if (zipCode && !isValidCEP(zipCode)) return res.status(400).json({ message: "CEP inválido" });
    item.zipCode = zipCode || null;
  }
  if (req.body.active !== undefined) item.active = Boolean(req.body.active);
  res.json(await repo.save(item));
}));

ApiRoutes.delete("/buildings/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const id = Number(req.params.id);
  const item = await AppDataSource.getRepository(Unidade).findOneBy({ id });
  if (!item) return res.status(404).json({ message: "Unidade não encontrada" });
  const [roomCount, courseCount] = await Promise.all([
    AppDataSource.getRepository(Sala).count({ where: { building: { id } } }),
    AppDataSource.getRepository(Turma).count({ where: { building: { id } } }),
  ]);
  if (roomCount || courseCount) return res.status(409).json({ message: "Esta unidade possui registros vinculados e não pode ser excluída. Inative a unidade em vez de excluí-la." });
  await AppDataSource.getRepository(Unidade).remove(item);
  res.status(204).send();
}));

ApiRoutes.get("/classrooms", asyncRoute(async (req: any, res: any) => {
  const qb = AppDataSource.getRepository(Sala).createQueryBuilder("room").leftJoinAndSelect("room.building", "building").orderBy("building.name", "ASC").addOrderBy("room.name", "ASC");
  if (req.query.buildingId) qb.andWhere("building.id = :buildingId", { buildingId: Number(req.query.buildingId) });
  if (req.query.search) qb.andWhere("(room.name LIKE :search OR room.code LIKE :search OR room.type LIKE :search)", { search: `%${req.query.search}%` });
  res.json(await qb.getMany());
}));

ApiRoutes.post("/classrooms", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Sala);
  const building = await AppDataSource.getRepository(Unidade).findOneBy({ id: Number(req.body.buildingId) });
  if (!building) return res.status(400).json({ message: "Unidade inválida" });
  if (!building.active) return res.status(400).json({ message: "Não é possível cadastrar uma sala em uma unidade inativa" });
  const capacity = Math.max(0, Number(req.body.capacity || 0));
  const item = repo.create({
    building,
    code: normalizeText(req.body.code),
    name: normalizeText(req.body.name || req.body.code),
    floor: req.body.floor ? normalizeText(req.body.floor) : null,
    capacity,
    recommendedCapacity: Number(req.body.recommendedCapacity || Math.floor(capacity * 0.8)),
    type: normalizeText(req.body.type || "SALA DE AULA"),
    resources: Array.isArray(req.body.resources) ? req.body.resources : [],
    active: req.body.active !== false,
  });
  if (!item.code || !item.name) return res.status(400).json({ message: "Código e nome da sala são obrigatórios" });
  if (!Number.isFinite(capacity) || capacity < 0 || !Number.isFinite(item.recommendedCapacity) || item.recommendedCapacity < 0 || item.recommendedCapacity > capacity) return res.status(400).json({ message: "Capacidades inválidas" });
  res.status(201).json(await repo.save(item));
}));

ApiRoutes.put("/classrooms/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Sala);
  const item = await repo.findOne({ where: { id: Number(req.params.id) }, relations: { building: true } });
  if (!item) return res.status(404).json({ message: "Sala não encontrada" });
  if (req.body.buildingId) {
    const building = await AppDataSource.getRepository(Unidade).findOneBy({ id: Number(req.body.buildingId) });
    if (!building) return res.status(400).json({ message: "Unidade inválida" });
    if (!building.active) return res.status(400).json({ message: "Não é possível mover uma sala para uma unidade inativa" });
    item.building = building;
  }
  for (const key of ["code", "name", "floor", "type"]) if (req.body[key] !== undefined) (item as any)[key] = req.body[key] ? normalizeText(req.body[key]) : null;
  for (const key of ["capacity", "recommendedCapacity"]) if (req.body[key] !== undefined) (item as any)[key] = Math.max(0, Number(req.body[key] || 0));
  if (req.body.resources !== undefined) item.resources = Array.isArray(req.body.resources) ? req.body.resources : [];
  if (!Number.isFinite(item.capacity) || item.capacity < 0 || !Number.isFinite(item.recommendedCapacity) || item.recommendedCapacity < 0 || item.recommendedCapacity > item.capacity) return res.status(400).json({ message: "Capacidades inválidas" });
  if (req.body.active !== undefined) item.active = Boolean(req.body.active);
  res.json(await repo.save(item));
}));

ApiRoutes.delete("/classrooms/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const result = await AppDataSource.getRepository(Sala).delete(Number(req.params.id));
  if (!result.affected) return res.status(404).json({ message: "Sala não encontrada" });
  res.status(204).send();
}));

ApiRoutes.get("/courses", asyncRoute(async (req: any, res: any) => {
  const qb = AppDataSource.getRepository(Turma).createQueryBuilder("course").leftJoinAndSelect("course.building", "building").leftJoinAndSelect("course.teacher", "teacher").leftJoinAndSelect("course.occupancies", "occupancy").leftJoinAndSelect("occupancy.classroom", "classroom").orderBy("course.startDate", "DESC");
  if (req.query.buildingId) qb.andWhere("building.id = :buildingId", { buildingId: Number(req.query.buildingId) });
  if (req.query.search) qb.andWhere("(course.name LIKE :search OR course.code LIKE :search OR course.instructor LIKE :search OR teacher.name LIKE :search)", { search: `%${req.query.search}%` });
  if (req.query.status) qb.andWhere("course.status = :status", { status: req.query.status });
  qb.take(Math.min(Number(req.query.limit || 500), 1000));
  res.json(await qb.getMany());
}));

ApiRoutes.post("/courses", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Turma);
  const building = req.body.buildingId ? await AppDataSource.getRepository(Unidade).findOneBy({ id: Number(req.body.buildingId) }) : null;
  if (req.body.buildingId && !building) return res.status(400).json({ message: "Unidade inválida" });
  if (building && !building.active) return res.status(400).json({ message: "Não é possível cadastrar uma turma em uma unidade inativa" });
  const teacher = req.body.teacherId ? await AppDataSource.getRepository(Professor).findOneBy({ id: Number(req.body.teacherId) }) : null;
  if (req.body.teacherId && !teacher) return res.status(400).json({ message: "Instrutor inválido" });
  const item = repo.create({
    code: normalizeText(req.body.code), name: normalizeText(req.body.name), abbreviation: req.body.abbreviation ? normalizeText(req.body.abbreviation) : null,
    workload: Number(req.body.workload || 0), segment: req.body.segment ? normalizeText(req.body.segment) : null, type: normalizeText(req.body.type || "TURMA"),
    startDate: dateOnly(req.body.startDate), endDate: dateOnly(req.body.endDate), shift: req.body.shift ? normalizeText(req.body.shift) : null,
    startTime: timeOnly(req.body.startTime), endTime: timeOnly(req.body.endTime), weekdays: normalizeDays(req.body.weekdays),
    students: Number(req.body.students || 0), status: normalizeText(req.body.status || "EM ANDAMENTO"), instructor: normalizePersonName(teacher?.name || req.body.instructor || "") || null, teacher,
    coordinator: normalizePersonName(req.body.coordinator || "") || null, notes: req.body.notes ? normalizeText(req.body.notes) : null, building,
  });
  if (!item.code || !item.name) return res.status(400).json({ message: "Código e nome da turma são obrigatórios" });
  if (item.startDate && item.startDate < currentDateSaoPaulo()) return res.status(400).json({ message: "A data inicial da turma não pode ser anterior à data atual" });
  if (item.startDate && item.endDate && !dateIsValidRange(item.startDate,item.endDate)) return res.status(400).json({ message: "A data inicial deve ser anterior ou igual à data final" });
  if (item.startTime && item.endTime && !timeIsValidRange(item.startTime,item.endTime)) return res.status(400).json({ message: "O horário inicial deve ser anterior ao horário final" });
  if (!Number.isFinite(item.students) || item.students < 0 || !Number.isFinite(item.workload) || item.workload < 0) return res.status(400).json({ message: "Alunos e carga horária inválidos" });
  res.status(201).json(await repo.save(item));
}));

ApiRoutes.put("/courses/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Turma);
  const item = await repo.findOne({ where: { id: Number(req.params.id) }, relations: { building: true, teacher: true } });
  if (!item) return res.status(404).json({ message: "Turma não encontrada" });
  if (req.body.buildingId !== undefined) {
    const building = req.body.buildingId ? await AppDataSource.getRepository(Unidade).findOneBy({ id: Number(req.body.buildingId) }) : null;
    if (req.body.buildingId && !building) return res.status(400).json({ message: "Unidade inválida" });
    if (building && !building.active) return res.status(400).json({ message: "Não é possível mover uma turma para uma unidade inativa" });
    item.building = building;
  }
  for (const key of ["code", "name", "abbreviation", "workload", "segment", "type", "startDate", "endDate", "shift", "startTime", "endTime", "weekdays", "students", "status", "notes"]) {
    if (req.body[key] !== undefined) (item as any)[key] = key === "weekdays" ? normalizeDays(req.body[key]) : ["code", "name", "abbreviation", "segment", "type", "shift", "status", "notes"].includes(key) ? (req.body[key] ? normalizeText(req.body[key]) : null) : req.body[key];
  }
  item.students = Number(item.students || 0); item.workload = Number(item.workload || 0);
  if (!Number.isFinite(item.students) || item.students < 0 || !Number.isFinite(item.workload) || item.workload < 0) return res.status(400).json({ message: "Alunos e carga horária inválidos" });
  if (req.body.teacherId !== undefined) {
    item.teacher = req.body.teacherId ? await AppDataSource.getRepository(Professor).findOneBy({ id: Number(req.body.teacherId) }) : null;
    if (req.body.teacherId && !item.teacher) return res.status(400).json({ message: "Instrutor inválido" });
    item.instructor = item.teacher ? normalizePersonName(item.teacher.name) : null;
  }
  if (req.body.instructor !== undefined && req.body.teacherId === undefined) item.instructor = normalizePersonName(req.body.instructor) || null;
  if (req.body.coordinator !== undefined) item.coordinator = normalizePersonName(req.body.coordinator) || null;
  if (item.startDate && item.startDate < currentDateSaoPaulo()) return res.status(400).json({ message: "A data inicial da turma não pode ser anterior à data atual" });
  if (item.startDate && item.endDate && !dateIsValidRange(item.startDate,item.endDate)) return res.status(400).json({ message: "A data inicial deve ser anterior ou igual à data final" });
  if (item.startTime && item.endTime && !timeIsValidRange(item.startTime,item.endTime)) return res.status(400).json({ message: "O horário inicial deve ser anterior ao horário final" });
  res.json(await repo.save(item));
}));

ApiRoutes.delete("/courses/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const result = await AppDataSource.getRepository(Turma).delete(Number(req.params.id));
  if (!result.affected) return res.status(404).json({ message: "Turma não encontrada" });
  res.status(204).send();
}));

ApiRoutes.get("/occupancies", asyncRoute(async (req: any, res: any) => {
  const qb = AppDataSource.getRepository(Alocacao).createQueryBuilder("occupancy").leftJoinAndSelect("occupancy.classroom", "classroom").leftJoinAndSelect("classroom.building", "building").leftJoinAndSelect("occupancy.course", "course").leftJoinAndSelect("course.teacher", "teacher").leftJoinAndSelect("occupancy.instructor", "instructor").orderBy("occupancy.startDate", "DESC");
  if (req.query.buildingId) qb.andWhere("building.id = :buildingId", { buildingId: Number(req.query.buildingId) });
  if (req.query.classroomId) qb.andWhere("classroom.id = :classroomId", { classroomId: Number(req.query.classroomId) });
  if (req.query.date) qb.andWhere("occupancy.startDate <= :date AND occupancy.endDate >= :date", { date: dateOnly(req.query.date) });
  res.json(await qb.take(1000).getMany());
}));

ApiRoutes.post("/occupancies", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Alocacao);
  const classroom = await AppDataSource.getRepository(Sala).findOne({ where: { id: Number(req.body.classroomId) }, relations: { building: true } });
  const course = req.body.courseId ? await AppDataSource.getRepository(Turma).findOne({ where: { id: Number(req.body.courseId) }, relations: { teacher: true, building: true } }) : null;
  if (!classroom || !classroom.active || !classroom.building?.active) return res.status(400).json({ message: "Sala inválida ou inativa" });
  if (req.body.courseId && !course) return res.status(400).json({ message: "Turma inválida" });
  if (course && course.building && course.building.id !== classroom.building.id) return res.status(400).json({ message: "A sala deve pertencer à mesma unidade da turma" });
  const shiftTimes: Record<string, { startTime: string; endTime: string }> = { MATUTINO: { startTime: "08:00:00", endTime: "12:00:00" }, VESPERTINO: { startTime: "14:00:00", endTime: "18:00:00" }, NOTURNO: { startTime: "19:00:00", endTime: "22:00:00" } };
  const requestedShift = normalizeText(req.body.shift || "MATUTINO");
  const selectedShiftTimes = shiftTimes[requestedShift] || null;
  const payload = { ...req.body, shift: requestedShift, startDate: dateOnly(req.body.startDate), endDate: dateOnly(req.body.endDate), startTime: selectedShiftTimes ? selectedShiftTimes.startTime : timeOnly(req.body.startTime), endTime: selectedShiftTimes ? selectedShiftTimes.endTime : timeOnly(req.body.endTime), weekdays: normalizeDays(req.body.weekdays) };
  if (!payload.startDate || !payload.endDate || !payload.startTime || !payload.endTime || !payload.weekdays.length) return res.status(400).json({ message: "Período, horário e dias da semana são obrigatórios" });
  if (payload.startDate > payload.endDate || payload.startTime >= payload.endTime) return res.status(400).json({ message: "O período ou horário informado é inválido" });
  if (payload.startDate < currentDateSaoPaulo()) return res.status(400).json({ message: "A data da alocação não pode ser anterior à data atual" });
  const conflicts = await conflictsFor(payload);
  if (conflicts.length) return res.status(409).json({ message: "A sala já está ocupada nesse período", conflicts });
  const instructorId = Number(req.body.instructorId || 0);
  const instructor = instructorId ? await AppDataSource.getRepository(Professor).findOneBy({ id: instructorId }) : (course?.teacher || null);
  if (instructorId && !instructor) return res.status(400).json({ message: "Instrutor inválido" });
  if (instructor) {
    const instructorConflicts = await instructorConflictsFor({ ...payload, instructorId: instructor.id });
    if (instructorConflicts.length) return res.status(409).json({ message: "O instrutor já está ocupado nesse período", conflicts: instructorConflicts });
  }
  const item = repo.create({ title: normalizeText(payload.title || course?.name || "RESERVA"), kind: normalizeText(payload.kind || (course ? "TURMA" : "RESERVA")), status: normalizeText(payload.status || "ATIVA"), shift: payload.shift, startDate: payload.startDate, endDate: payload.endDate, startTime: payload.startTime, endTime: payload.endTime, weekdays: payload.weekdays, notes: payload.notes ? normalizeText(payload.notes) : null, classroom, course, instructor });
  res.status(201).json(await repo.save(item));
}));

ApiRoutes.put("/occupancies/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const repo = AppDataSource.getRepository(Alocacao);
  const item = await repo.findOne({ where: { id: Number(req.params.id) }, relations: { classroom: true, course: { teacher: true }, instructor: true } });
  if (!item) return res.status(404).json({ message: "Alocação não encontrada" });
  const payload = {
    ...item,
    ...req.body,
    classroomId: req.body.classroomId || item.classroom.id,
    startDate: dateOnly(req.body.startDate ?? item.startDate),
    endDate: dateOnly(req.body.endDate ?? item.endDate),
    startTime: timeOnly(req.body.startTime ?? item.startTime),
    endTime: timeOnly(req.body.endTime ?? item.endTime),
    weekdays: req.body.weekdays !== undefined ? normalizeDays(req.body.weekdays) : normalizeDays(item.weekdays),
    shift: normalizeText(req.body.shift ?? item.shift ?? "MATUTINO"),
  };
  const shiftTimes: Record<string, { startTime: string; endTime: string }> = { MATUTINO: { startTime: "08:00:00", endTime: "12:00:00" }, VESPERTINO: { startTime: "14:00:00", endTime: "18:00:00" }, NOTURNO: { startTime: "19:00:00", endTime: "22:00:00" } };
  if (shiftTimes[payload.shift]) { payload.startTime = shiftTimes[payload.shift].startTime; payload.endTime = shiftTimes[payload.shift].endTime; }
  if (!payload.startDate || !payload.endDate || !payload.startTime || !payload.endTime || !payload.weekdays.length) return res.status(400).json({ message: "Período, horário e dias da semana são obrigatórios" });
  if (payload.startDate > payload.endDate || payload.startTime >= payload.endTime) return res.status(400).json({ message: "O período ou horário informado é inválido" });
  const conflicts = await conflictsFor(payload, item.id);
  if (conflicts.length) return res.status(409).json({ message: "A sala já está ocupada nesse período", conflicts });
  const effectiveInstructorId = Number(req.body.instructorId || item.instructor?.id || item.course?.teacher?.id || 0);
  if (effectiveInstructorId) {
    const instructorConflicts = await instructorConflictsFor({ ...payload, instructorId: effectiveInstructorId }, item.id);
    if (instructorConflicts.length) return res.status(409).json({ message: "O instrutor já está ocupado nesse período", conflicts: instructorConflicts });
  }
  if (req.body.classroomId) item.classroom = await AppDataSource.getRepository(Sala).findOneByOrFail({ id: Number(req.body.classroomId) });
  if (req.body.courseId !== undefined) item.course = req.body.courseId ? await AppDataSource.getRepository(Turma).findOne({ where: { id: Number(req.body.courseId) }, relations: { teacher: true } }) : null;
  if (req.body.instructorId !== undefined) item.instructor = req.body.instructorId ? await AppDataSource.getRepository(Professor).findOneBy({ id: Number(req.body.instructorId) }) : null;
  else if (!item.instructor && item.course?.teacher) item.instructor = item.course.teacher;
  for (const key of ["title", "kind", "status", "shift", "startDate", "endDate", "startTime", "endTime", "weekdays", "notes"]) if (req.body[key] !== undefined) (item as any)[key] = key === "weekdays" ? normalizeDays(req.body[key]) : ["title", "kind", "status", "shift", "notes"].includes(key) ? (req.body[key] ? normalizeText(req.body[key]) : null) : req.body[key];
  item.shift = payload.shift; item.startTime = payload.startTime; item.endTime = payload.endTime;
  res.json(await repo.save(item));
}));

ApiRoutes.delete("/occupancies/:id", requireAdmin, asyncRoute(async (req: any, res: any) => {
  const result = await AppDataSource.getRepository(Alocacao).delete(Number(req.params.id));
  if (!result.affected) return res.status(404).json({ message: "Alocação não encontrada" });
  res.status(204).send();
}));

ApiRoutes.get("/classrooms/availability", asyncRoute(async (req: any, res: any) => {
  const startDate=dateOnly(req.query.startDate || req.query.date), endDate=dateOnly(req.query.endDate || req.query.date || req.query.startDate);
  const startTime=timeOnly(req.query.startTime), endTime=timeOnly(req.query.endTime);
  const requestedDays=Array.isArray(req.query.weekdays)?normalizeDays(req.query.weekdays):normalizeDays(String(req.query.weekdays || "").split(","));
  if(!startDate||!endDate||!startTime||!endTime||!requestedDays.length) return res.status(400).json({message:"Período, horário e dias da semana são obrigatórios"});
  if(!dateIsValidRange(startDate,endDate)||!timeIsValidRange(startTime,endTime)) return res.status(400).json({message:"Período ou horário inválido"});
  const roomQb=AppDataSource.getRepository(Sala).createQueryBuilder("room").leftJoinAndSelect("room.building","building").where("room.active = true");
  if(req.query.buildingId) roomQb.andWhere("building.id = :buildingId",{buildingId:Number(req.query.buildingId)});
  const rooms=await roomQb.orderBy("room.name","ASC").getMany();
  const occupancies=await AppDataSource.getRepository(Alocacao).createQueryBuilder("occupancy").leftJoinAndSelect("occupancy.classroom","classroom").leftJoinAndSelect("occupancy.course","course").where("occupancy.startDate <= :endDate AND occupancy.endDate >= :startDate",{startDate,endDate}).andWhere("occupancy.status <> 'CANCELADA'").getMany();
  const excludeOccupancyId = Number(req.query.excludeOccupancyId || 0);
  const byRoom=new Map<number,Alocacao[]>();
  for(const item of occupancies.filter(item=>item.id !== excludeOccupancyId && normalizeDays(item.weekdays).some(day=>requestedDays.includes(day))&&overlapsTime(startTime,endTime,item.startTime,item.endTime))){const list=byRoom.get(item.classroom.id)||[];list.push(item);byRoom.set(item.classroom.id,list);}
  res.json({ rooms: rooms.map(room=>({...room,available:!byRoom.has(room.id),conflicts:byRoom.get(room.id)||[]})), meta: { buildingId: req.query.buildingId ? Number(req.query.buildingId) : null, totalActiveRooms: rooms.length } });
}));

ApiRoutes.get("/teachers/availability", asyncRoute(async (req: any, res: any) => {
  const startDate = dateOnly(req.query.startDate || req.query.date) || currentDateSaoPaulo();
  const endDate = dateOnly(req.query.endDate || req.query.date || req.query.startDate) || startDate;
  const requestedStart = req.query.startTime ? timeOnly(req.query.startTime) : null;
  const requestedEnd = req.query.endTime ? timeOnly(req.query.endTime) : null;
  const requestedDays = Array.isArray(req.query.weekdays) ? normalizeDays(req.query.weekdays) : normalizeDays(String(req.query.weekdays || "").split(","));
  if ((requestedStart && !requestedEnd) || (!requestedStart && requestedEnd) || (requestedStart && requestedEnd && !timeIsValidRange(requestedStart, requestedEnd))) return res.status(400).json({ message: "Horário inválido" });
  if (!dateIsValidRange(startDate, endDate)) return res.status(400).json({ message: "Período inválido" });
  const dayLabels = requestedDays.length ? requestedDays : [weekdayLabels[new Date(`${startDate}T12:00:00`).getDay()]];
  const teachers = await AppDataSource.getRepository(Professor).find({ order: { name: "ASC" } });
  const occupancyQb = AppDataSource.getRepository(Alocacao).createQueryBuilder("occupancy")
    .leftJoinAndSelect("occupancy.course", "course")
    .leftJoinAndSelect("course.teacher", "courseTeacher")
    .leftJoinAndSelect("occupancy.instructor", "instructor")
    .leftJoinAndSelect("occupancy.classroom", "classroom")
    .leftJoinAndSelect("classroom.building", "building")
    .where("occupancy.startDate <= :endDate AND occupancy.endDate >= :startDate", { startDate, endDate })
    .andWhere("occupancy.status <> 'CANCELADA'");
  const occupancies = await occupancyQb.getMany();
  const excludeOccupancyId = Number(req.query.excludeOccupancyId || 0);
  const byTeacher = new Map<number, Alocacao[]>();
  for (const item of occupancies) {
    if (item.id === excludeOccupancyId) continue;
    if (!item.weekdays.some((day) => dayLabels.includes(day))) continue;
    if (requestedStart && requestedEnd && !overlapsTime(requestedStart, requestedEnd, item.startTime, item.endTime)) continue;
    const effectiveTeacher = item.instructor || item.course?.teacher;
    if (!effectiveTeacher) continue;
    const list = byTeacher.get(effectiveTeacher.id) || [];
    list.push(item);
    byTeacher.set(effectiveTeacher.id, list);
  }
  const teacherCourses = await AppDataSource.getRepository(Turma).find({ relations: { teacher: true } });
  const shiftsByTeacher = new Map<number, Set<string>>();
  for (const course of teacherCourses) {
    if (!course.teacher?.id || !course.shift) continue;
    const set = shiftsByTeacher.get(course.teacher.id) || new Set<string>();
    set.add(String(course.shift));
    shiftsByTeacher.set(course.teacher.id, set);
  }
  const items = teachers.filter((teacher) => teacher.active).map((teacher) => ({
    id: teacher.id, registration: teacher.registration, name: teacher.name,
    segment: teacher.area || "Não informado", specialty: teacher.specialty || null,
    shifts: Array.from(shiftsByTeacher.get(teacher.id) || []), available: !(byTeacher.get(teacher.id) || []).length,
    date: startDate, endDate, day: dayLabels.join(" / "), startTime: requestedStart, endTime: requestedEnd,
    scheduleLabel: requestedStart && requestedEnd ? `${requestedStart.slice(0, 5)} – ${requestedEnd.slice(0, 5)}` : "DIA TODO",
  }));
  res.json(items.filter((item) => item.available));
}));

ApiRoutes.get("/dashboard", asyncRoute(async (req: any, res: any) => {
  const date = dateOnly(req.query.date) || new Date().toISOString().slice(0, 10);
  const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
  const roomQb = AppDataSource.getRepository(Sala).createQueryBuilder("room").leftJoinAndSelect("room.building", "building").where("room.active = true");
  if (buildingId) roomQb.andWhere("building.id = :buildingId", { buildingId });
  const rooms = await roomQb.getMany();
  const day = weekdayLabels[new Date(`${date}T12:00:00`).getDay()];
  const occupancyQb = AppDataSource.getRepository(Alocacao).createQueryBuilder("occupancy").leftJoinAndSelect("occupancy.classroom", "classroom").leftJoinAndSelect("classroom.building", "building").leftJoinAndSelect("occupancy.course", "course").where("occupancy.startDate <= :date AND occupancy.endDate >= :date", { date }).andWhere("occupancy.status <> 'CANCELADA'");
  if (buildingId) occupancyQb.andWhere("building.id = :buildingId", { buildingId });
  const all = await occupancyQb.getMany();
  const schedule = all.filter((item) => item.weekdays.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const occupiedRoomIds = new Set(schedule.map((item) => item.classroom.id));
  const courseQb = AppDataSource.getRepository(Turma).createQueryBuilder("course").leftJoin("course.building", "building").where("course.startDate <= :date AND course.endDate >= :date", { date });
  if (buildingId) courseQb.andWhere("building.id = :buildingId", { buildingId });
  const activeTurmas = await courseQb.getCount();
  const unallocatedQb = AppDataSource.getRepository(Turma).createQueryBuilder("course").leftJoin("course.building", "building").leftJoin("course.occupancies", "occupancy").where("course.startDate <= :date AND course.endDate >= :date", { date }).andWhere("occupancy.id IS NULL");
  if (buildingId) unallocatedQb.andWhere("building.id = :buildingId", { buildingId });

  const overviewRooms = await AppDataSource.getRepository(Sala).createQueryBuilder("room").leftJoinAndSelect("room.building", "building").where("room.active = true").getMany();
  const overviewOccupancies = await AppDataSource.getRepository(Alocacao).createQueryBuilder("occupancy").leftJoinAndSelect("occupancy.classroom", "classroom").leftJoinAndSelect("occupancy.course", "course").leftJoinAndSelect("course.teacher", "teacher").leftJoinAndSelect("occupancy.instructor", "instructor").where("occupancy.startDate <= :date AND occupancy.endDate >= :date", { date }).andWhere("occupancy.status <> 'CANCELADA'").getMany();
  const overviewOccupiedIds = new Set(overviewOccupancies.filter((item) => item.weekdays.includes(day)).map((item) => item.classroom.id));
  const activeTeachers = await AppDataSource.getRepository(Professor).find({ where: { active: true } });
  const occupiedTeacherIds = new Set(overviewOccupancies.filter((item) => item.weekdays.includes(day) && (item.instructor?.id || item.course?.teacher?.id)).map((item) => item.instructor?.id || item.course!.teacher!.id));
  const instructorsAvailable = activeTeachers.filter((teacher) => !occupiedTeacherIds.has(teacher.id)).length;
  const buildings = await AppDataSource.getRepository(Unidade).find({ where: { active: true }, order: { name: "ASC" } });
  const occupancyByUnidade = buildings.map((building) => {
    const buildingRooms = overviewRooms.filter((room) => room.building?.id === building.id);
    const occupied = buildingRooms.filter((room) => overviewOccupiedIds.has(room.id)).length;
    return {
      building: { id: building.id, code: building.code, name: building.name },
      rooms: buildingRooms.length,
      occupied,
      available: Math.max(buildingRooms.length - occupied, 0),
      occupancyRate: buildingRooms.length ? Math.round((occupied / buildingRooms.length) * 100) : 0,
    };
  });

  res.json({
    date,
    metrics: { rooms: rooms.length, occupied: occupiedRoomIds.size, available: Math.max(rooms.length - occupiedRoomIds.size, 0), occupancyRate: rooms.length ? Math.round((occupiedRoomIds.size / rooms.length) * 100) : 0, activeTurmas, instructorsAvailable, unallocated: await unallocatedQb.getCount() },
    schedule,
    roomDetails: rooms.map((room) => {
      const roomOccupancies = schedule.filter((item) => item.classroom.id === room.id).map((item) => ({ id: item.id, title: item.title, startTime: item.startTime, endTime: item.endTime, kind: item.kind, course: item.course ? { id: item.course.id, code: item.course.code, name: item.course.name } : null }));
      return { ...room, available: roomOccupancies.length === 0, occupancies: roomOccupancies };
    }),
    occupancyByUnidade,
  });
}));

export { ApiRoutes };
