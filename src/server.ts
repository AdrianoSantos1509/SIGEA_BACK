import "reflect-metadata";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import turmaRoutes from "./routes/turma.routes";
import {
  unidadeRoutes,
  segmentoRoutes,
  salaRoutes,
  instrutorRoutes,
  coordenadorRoutes,
} from "./routes/lookup.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/turmas", turmaRoutes);
app.use("/unidades", unidadeRoutes);
app.use("/segmentos", segmentoRoutes);
app.use("/salas", salaRoutes);
app.use("/instrutores", instrutorRoutes);
app.use("/coordenadores", coordenadorRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3333;

AppDataSource.initialize()
  .then(() => {
    console.log("Conectado ao MySQL com sucesso");
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar ao banco de dados:", err);
  });
