const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/seed.json"), "utf8"));
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  let updatedCourses = 0;
  let updatedOccupancies = 0;
  await connection.beginTransaction();
  try {
    for (const item of seed.classes) {
      const weekdays = JSON.stringify(item.weekdays || []);
      const [courseResult] = await connection.execute("UPDATE courses SET weekdays = ? WHERE code = ?", [weekdays, item.code]);
      const [occupancyResult] = await connection.execute(
        "UPDATE occupancies o INNER JOIN courses c ON c.id = o.courseId SET o.weekdays = ? WHERE c.code = ?",
        [weekdays, item.code],
      );
      updatedCourses += courseResult.affectedRows;
      updatedOccupancies += occupancyResult.affectedRows;
    }
    await connection.commit();
    console.log(JSON.stringify({ updatedCourses, updatedOccupancies }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
