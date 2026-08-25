import fs from "fs";
import path from "path";
import { AppDataSource } from "./data-source";
import { Unidade } from "./entities/unidade";
import { Sala } from "./entities/sala";
import { Turma } from "./entities/turma";
import { Alocacao } from "./entities/alocacao";
import { Usuario } from "./entities/usuario";
import { Professor } from "./entities/professor";
import { encryptData } from "./middleware/bcrypt.middleware";
import { IsNull } from "typeorm";
import { normalizePersonName } from "./services/validation";

type SeedData = {
  buildings: any[];
  rooms: any[];
  classes: any[];
};

function normalizeRoom(value: string) {
  return String(value || "").toUpperCase().replace(/SALA|LABORATÓRIO|LAB\.?|SI|TI/g, "").replace(/[^A-Z0-9]/g, "");
}

export async function seedDatabase() {
  const buildingRepo = AppDataSource.getRepository(Unidade);
  const roomRepo = AppDataSource.getRepository(Sala);
  const courseRepo = AppDataSource.getRepository(Turma);
  const occupancyRepo = AppDataSource.getRepository(Alocacao);
  const userRepo = AppDataSource.getRepository(Usuario);
  const teacherRepo = AppDataSource.getRepository(Professor);

  async function seedProfessorsFromTurmas() {
    if ((await teacherRepo.count()) > 0) return;
    const courses = await courseRepo.find({ relations: { building: true, teacher: true } });
    const groups = new Map<string, Turma[]>();
    for (const course of courses) {
      const name = String(course.instructor || "").trim();
      if (!name) continue;
      const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ");
      const list = groups.get(key) || [];
      list.push(course);
      groups.set(key, list);
    }
    let sequence = 1;
    for (const courseList of groups.values()) {
      const first = courseList[0];
      const teacher = await teacherRepo.save(teacherRepo.create({
        registration: `IMP-${String(sequence).padStart(4, "0")}`,
        name: first.instructor as string,
        email: null,
        phone: null,
        area: first.segment || null,
        specialty: first.type || null,
        notes: "Cadastro importado das turmas existentes; matrícula e contatos precisam ser revisados.",
        active: true,
        building: first.building || null,
      }));
      for (const course of courseList) course.teacher = teacher;
      await courseRepo.save(courseList);
      sequence += 1;
    }
  }

  if ((await userRepo.count()) === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASS) {
    await userRepo.save(userRepo.create({
      name: process.env.ADMIN_NAME || "Administrador SIGEA",
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      password: encryptData(process.env.ADMIN_PASS),
      role: "ADMIN",
      active: true,
      regNumber: null,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    }));
  }

  await userRepo.update({ passwordChangedAt: IsNull(), mustChangePassword: false }, { passwordChangedAt: new Date() });
  for (const user of await userRepo.find()) { const name=normalizePersonName(user.name); if(user.name!==name) await userRepo.update(user.id,{name}); }
  for (const teacher of await teacherRepo.find()) { const name=normalizePersonName(teacher.name); if(teacher.name!==name) await teacherRepo.update(teacher.id,{name}); }
  for (const course of await courseRepo.find()) { let changed=false; const instructor=course.instructor?normalizePersonName(course.instructor):null; const coordinator=course.coordinator?normalizePersonName(course.coordinator):null; if(course.instructor!==instructor){course.instructor=instructor;changed=true;} if(course.coordinator!==coordinator){course.coordinator=coordinator;changed=true;} if(changed) await courseRepo.save(course); }

  if ((await buildingRepo.count()) > 0 || (await courseRepo.count()) > 0) {
    await seedProfessorsFromTurmas();
    return;
  }
  const seedPath = path.resolve(__dirname, "../data/seed.json");
  if (!fs.existsSync(seedPath)) return;
  const data = JSON.parse(fs.readFileSync(seedPath, "utf8")) as SeedData;
  const buildings = new Map<string, Unidade>();

  for (const item of data.buildings) {
    const saved = await buildingRepo.save(buildingRepo.create({
      code: String(item.code),
      name: String(item.name),
      location: item.location || null,
      active: true,
    }));
    buildings.set(item.code, saved);
  }

  const roomMap = new Map<string, Sala[]>();
  for (const item of data.rooms) {
    const building = buildings.get(item.buildingCode);
    if (!building) continue;
    const room = await roomRepo.save(roomRepo.create({
      building,
      code: item.code,
      name: item.name,
      capacity: item.capacity || 0,
      recommendedCapacity: item.recommendedCapacity || Math.floor((item.capacity || 0) * 0.8),
      type: item.type || "Sala de aula",
      resources: [],
      active: true,
      floor: null,
    }));
    const list = roomMap.get(item.buildingCode) || [];
    list.push(room);
    roomMap.set(item.buildingCode, list);
  }

  for (const item of data.classes) {
    const building = buildings.get(item.buildingCode) || null;
    const course = await courseRepo.save(courseRepo.create({
      code: item.code,
      name: item.name,
      abbreviation: item.abbreviation || null,
      workload: item.workload || 0,
      segment: item.segment || null,
      type: item.type || "Turma",
      startDate: item.startDate,
      endDate: item.endDate,
      shift: item.shift || null,
      startTime: item.startTime,
      endTime: item.endTime,
      weekdays: item.weekdays || [],
      students: item.students || 0,
      status: item.status || "Em andamento",
      instructor: item.instructor || null,
      coordinator: item.coordinator || null,
      notes: item.notes || null,
      building,
    }));
    if (!building || !item.classroomCode || !item.startDate || !item.endDate || !item.startTime || !item.endTime || !item.weekdays?.length) continue;
    const target = normalizeRoom(item.classroomCode);
    const rooms = roomMap.get(item.buildingCode) || [];
    const room = rooms.find((candidate) => {
      const normalized = normalizeRoom(candidate.code);
      return normalized === target || normalized.includes(target) || target.includes(normalized);
    });
    if (!room) continue;
    await occupancyRepo.save(occupancyRepo.create({
      title: `${course.code} · ${course.name}`.slice(0, 180),
      kind: "TURMA",
      status: "ATIVA",
      startDate: item.startDate,
      endDate: item.endDate,
      startTime: item.startTime,
      endTime: item.endTime,
      weekdays: item.weekdays,
      notes: item.notes || null,
      classroom: room,
      course,
    }));
  }
  await seedProfessorsFromTurmas();
}
