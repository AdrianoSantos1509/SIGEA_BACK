import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Turma } from "./entities/turma";
import { Alocacao } from "./entities/alocacao";

// Acerta as turmas cujo TITULAR ficou diferente do instrutor das suas alocações
// (acontecia quando o instrutor era trocado na tela de Alocações e a turma não acompanhava).
//
// Regra: a ALOCAÇÃO prevalece (foi a última troca feita pelo usuário).
//   - todas as alocações da turma têm o mesmo instrutor X  -> a turma passa a ter X como titular
//   - alocação sem instrutor e turma com titular            -> a alocação recebe o titular da turma
//   - alocações da mesma turma com instrutores diferentes   -> não mexe, só avisa (resolver manualmente)
//
// Uso:
//   npx ts-node src/sincronizar-titulares.ts            (só mostra o que seria alterado)
//   npx ts-node src/sincronizar-titulares.ts --aplicar  (grava as alterações)
export type TitularFix = { course: any; action: "turma" | "alocacao" | "manual"; from: string; to: string; note?: string };

export function planTitularFixes(courses: any[]): TitularFix[] {
  const fixes: TitularFix[] = [];
  for (const course of courses) {
    const occupancies: any[] = (course.occupancies || []).filter((occ: any) => occ.status !== "CANCELADA");
    if (!occupancies.length) continue;
    const titular = course.teacher || null;
    const withInstructor = occupancies.filter((occ) => occ.instructor);
    const distinct = new Set(withInstructor.map((occ) => occ.instructor.id));
    if (distinct.size > 1) {
      fixes.push({ course, action: "manual", from: titular?.name || "(sem titular)", to: [...new Set(withInstructor.map((occ) => occ.instructor.name))].join(" / "), note: "alocações com instrutores diferentes" });
    } else if (distinct.size === 1) {
      const instructor = withInstructor[0].instructor;
      if (titular?.id !== instructor.id) fixes.push({ course, action: "turma", from: titular?.name || "(sem titular)", to: instructor.name });
    } else if (titular) {
      fixes.push({ course, action: "alocacao", from: "(alocação sem instrutor)", to: titular.name });
    }
  }
  return fixes;
}

export async function main(apply = process.argv.includes("--aplicar")) {
  const weInitialized = !AppDataSource.isInitialized;
  if (weInitialized) await AppDataSource.initialize();
  const courses = await AppDataSource.getRepository(Turma).find({ relations: { teacher: true, occupancies: { instructor: true } }, order: { code: "ASC" } });
  const fixes = planTitularFixes(courses);
  if (!fixes.length) {
    console.log("Tudo certo: o titular de todas as turmas está igual ao instrutor das alocações.");
  } else {
    console.log(`${fixes.length} turma(s) com titular desencontrado:\n`);
    for (const fix of fixes) {
      const what = fix.action === "turma" ? `titular da TURMA: ${fix.from}  ->  ${fix.to}` : fix.action === "alocacao" ? `instrutor da(s) ALOCAÇÃO(ÕES): ${fix.from}  ->  ${fix.to}` : `NÃO ALTERA (${fix.note}): titular ${fix.from} | alocações ${fix.to}`;
      console.log(`  ${fix.course.code} · ${fix.course.name}\n     ${what}`);
    }
    if (!apply) {
      console.log("\nNada foi gravado. Para aplicar as alterações acima, rode de novo com --aplicar.");
    } else {
      const turmaRepo = AppDataSource.getRepository(Turma);
      const occRepo = AppDataSource.getRepository(Alocacao);
      let done = 0;
      for (const fix of fixes) {
        const course = fix.course;
        if (fix.action === "turma") {
          const instructor = course.occupancies.find((occ: any) => occ.instructor)?.instructor;
          course.teacher = instructor;
          course.instructor = String(instructor.name).trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");
          const { occupancies, ...courseOnly } = course;
          await turmaRepo.save(courseOnly);
          done++;
        } else if (fix.action === "alocacao") {
          const targets = course.occupancies.filter((occ: any) => !occ.instructor && occ.status !== "CANCELADA");
          targets.forEach((occ: any) => { occ.instructor = course.teacher; });
          await occRepo.save(targets);
          done++;
        }
      }
      console.log(`\n${done} turma(s) acertada(s).`);
    }
  }
  if (weInitialized) await AppDataSource.destroy();
}

if (require.main === module) {
  main().catch((error) => { console.error("Erro:", error.message); process.exit(1); });
}