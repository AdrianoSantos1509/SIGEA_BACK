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
import { normalizePersonName, normalizeText } from "./services/validation";

type SeedData = {
  buildings: any[];
  rooms: any[];
  classes: any[];
};

function normalizeRoom(value: string) {
  return String(value || "").toUpperCase().replace(/SALA|LABORATÓRIO|LAB\.?|SI|TI/g, "").replace(/[^A-Z0-9]/g, "");
}

function shiftFromTimes(startTime: string | null | undefined, endTime: string | null | undefined) {
  const start = String(startTime || "").slice(0, 5);
  const end = String(endTime || "").slice(0, 5);
  if (start === "08:00" && end === "12:00") return "MATUTINO";
  if (start === "14:00" && end === "18:00") return "VESPERTINO";
  if (start === "19:00" && end === "22:00") return "NOTURNO";
  return "MATUTINO";
}

export async function seedDatabase() {
  const buildingRepo = AppDataSource.getRepository(Unidade);
  const roomRepo = AppDataSource.getRepository(Sala);
  const courseRepo = AppDataSource.getRepository(Turma);
  const occupancyRepo = AppDataSource.getRepository(Alocacao);
  const userRepo = AppDataSource.getRepository(Usuario);
  const teacherRepo = AppDataSource.getRepository(Professor);

  async function normalizeGlobalInstructors() {
    const teachers = await teacherRepo.find();
    const groups = new Map<string, Professor[]>();
    for (const teacher of teachers) {
      const key = normalizePersonName(teacher.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const list = groups.get(key) || [];
      list.push(teacher);
      groups.set(key, list);
    }
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      group.sort((a, b) => a.id - b.id);
      const canonical = group[0];
      for (const duplicate of group.slice(1)) {
        const courses = await courseRepo.find({ where: { teacher: { id: duplicate.id } } });
        for (const course of courses) { course.teacher = canonical; course.instructor = normalizePersonName(canonical.name); }
        if (courses.length) await courseRepo.save(courses);
        const allocations = await occupancyRepo.find({ relations: { instructor: true, course: true } });
        for (const allocation of allocations.filter((item) => item.instructor?.id === duplicate.id)) { allocation.instructor = canonical; await occupancyRepo.save(allocation); }
        await teacherRepo.remove(duplicate);
      }
    }
  }

  async function seedProfessorsFromTurmas() {
    if ((await teacherRepo.count()) > 0) return;
    const courses = await courseRepo.find({ relations: { teacher: true } });
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
  for (const teacher of await teacherRepo.find()) { const name=normalizePersonName(teacher.name); const area=teacher.area?normalizeText(teacher.area):null; const specialty=teacher.specialty?normalizeText(teacher.specialty):null; const notes=teacher.notes?normalizeText(teacher.notes):null; if(teacher.name!==name||teacher.area!==area||teacher.specialty!==specialty||teacher.notes!==notes) await teacherRepo.update(teacher.id,{name,area,specialty,notes}); }
  await normalizeGlobalInstructors();
  for (const building of await buildingRepo.find()) { const name=normalizeText(building.name); const location=building.location?normalizeText(building.location):null; if(building.name!==name||building.location!==location) await buildingRepo.update(building.id,{name,location}); }
  for (const room of await roomRepo.find()) { room.code=normalizeText(room.code); room.name=normalizeText(room.name); room.floor=room.floor?normalizeText(room.floor):null; room.type=normalizeText(room.type); room.resources=room.resources?.map(normalizeText) || []; await roomRepo.save(room); }
  for (const course of await courseRepo.find()) { let changed=false; const values:any={code:normalizeText(course.code),name:normalizeText(course.name),abbreviation:course.abbreviation?normalizeText(course.abbreviation):null,segment:course.segment?normalizeText(course.segment):null,type:normalizeText(course.type),shift:course.shift?normalizeText(course.shift):null,status:normalizeText(course.status),instructor:course.instructor?normalizePersonName(course.instructor):null,coordinator:course.coordinator?normalizePersonName(course.coordinator):null,notes:course.notes?normalizeText(course.notes):null}; for(const key of Object.keys(values)){if((course as any)[key]!==values[key]){(course as any)[key]=values[key];changed=true;}} if(changed) await courseRepo.save(course); }
  for (const allocation of await occupancyRepo.find()) { allocation.title=normalizeText(allocation.title); allocation.kind=normalizeText(allocation.kind); allocation.status=normalizeText(allocation.status); allocation.shift=allocation.shift && ["MATUTINO", "VESPERTINO", "NOTURNO"].includes(normalizeText(allocation.shift)) ? normalizeText(allocation.shift) : shiftFromTimes(allocation.startTime, allocation.endTime);
    if (allocation.shift === "MATUTINO" && shiftFromTimes(allocation.startTime, allocation.endTime) !== "MATUTINO") allocation.shift = shiftFromTimes(allocation.startTime, allocation.endTime); allocation.notes=allocation.notes?normalizeText(allocation.notes):null; await occupancyRepo.save(allocation); }

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
      code: String(item.cnpj || item.code),
      name: String(item.name),
      location: item.location || null,
      zipCode: item.zipCode || null,
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
      type: normalizeText(item.type || "SALA DE AULA"),
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
      type: normalizeText(item.type || "TURMA"),
      startDate: item.startDate,
      endDate: item.endDate,
      shift: item.shift || null,
      startTime: item.startTime,
      endTime: item.endTime,
      weekdays: item.weekdays || [],
      students: item.students || 0,
      status: normalizeText(item.status || "EM ANDAMENTO"),
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
      title: normalizeText(`${course.code} · ${course.name}`).slice(0, 180),
      kind: "TURMA",
      status: "ATIVA",
      shift: normalizeText(item.shift || "MATUTINO"),
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
