import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Turma } from "./entities/turma";
import { courseTeacherClash } from "./routes/api";

// Lista as turmas que JÁ estão cadastradas com o mesmo instrutor ao mesmo tempo
// (mesmo período, dia da semana em comum e mesmo turno/horário), em qualquer unidade.
// Uso: npx ts-node src/listar-conflitos.ts
export function findCourseConflicts(courses: any[]) {
  const pairs: { a: any; b: any }[] = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      if (courseTeacherClash(courses[i], courses[j])) pairs.push({ a: courses[i], b: courses[j] });
    }
  }
  return pairs;
}

const describe = (c: any) => {
  const hhmm = (v: any) => String(v || "").slice(0, 5);
  return `${c.code} · ${c.name} | ${c.building?.name || "sem unidade"} | ${c.shift || "sem turno"} ${hhmm(c.startTime)}-${hhmm(c.endTime)} | ${String(c.startDate || "").slice(0, 10)} a ${String(c.endDate || "").slice(0, 10)} | ${(c.weekdays || []).join("/")}`;
};

async function main() {
  await AppDataSource.initialize();
  const courses = await AppDataSource.getRepository(Turma).find({ relations: { teacher: true, building: true }, order: { code: "ASC" } });
  const pairs = findCourseConflicts(courses);
  if (!pairs.length) {
    console.log("Nenhum conflito de instrutor encontrado entre as turmas cadastradas.");
  } else {
    console.log(`${pairs.length} conflito(s) de instrutor encontrado(s):\n`);
    pairs.forEach(({ a, b }, index) => {
      console.log(`#${index + 1}  Instrutor: ${a.teacher?.name || a.instructor || b.teacher?.name || b.instructor}`);
      console.log(`    A) ${describe(a)}`);
      console.log(`    B) ${describe(b)}\n`);
    });
    console.log("Para corrigir: edite uma das turmas de cada par (troque o instrutor, o turno/horário, os dias ou o período).");
  }
  await AppDataSource.destroy();
}

if (require.main === module) {
  main().catch((error) => { console.error("Erro ao listar conflitos:", error.message); process.exit(1); });
}