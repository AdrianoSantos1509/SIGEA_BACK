import cors from "cors";
import express from "express";
import { AppDataSource } from "./data-source";
import { requireAuth, requirePasswordCurrent } from "./middleware/token.middleware";
import { ApiRoutes } from "./routes/api";
import { UserRoutes } from "./routes/user";
import { ManagementRoutes } from "./routes/management";
import { seedDatabase } from "./seed";

const app = express();
const port = Number(process.env.PORT || 3300);

const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error("Origem não autorizada"));
  },
}));
app.use(express.json({ limit: "2mb" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/users", UserRoutes);
app.use("/api", requireAuth, requirePasswordCurrent, ManagementRoutes, ApiRoutes);
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error(error);
  const duplicate = error?.code === "ER_DUP_ENTRY";
  res.status(duplicate ? 409 : 500).json({ message: duplicate ? "Já existe um registro com esse código" : "Erro interno do servidor" });
});

AppDataSource.initialize()
  .then(async () => {
    await seedDatabase();
    app.listen(port, () => console.log(`SIGEA API disponível em http://localhost:${port}`));
  })
  .catch((error) => {
    console.error("Não foi possível conectar ao banco de dados:", error.message);
    process.exitCode = 1;
  });
