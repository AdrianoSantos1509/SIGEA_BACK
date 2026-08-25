import "reflect-metadata";
import { DataSource } from "typeorm";
import { Unidade } from "./entities/unidade";
import { Sala } from "./entities/sala";
import { Coordenador } from "./entities/coordenador";
import { Turma } from "./entities/turma";
import { Alocacao } from "./entities/alocacao";
import { Usuario } from "./entities/usuario";
import { Professor } from "./entities/professor";

const envPath = require("path").resolve(__dirname, "../.env");
const localEnvPath = require("path").resolve(__dirname, "../.env.local");
require("dotenv").config({ path: envPath });
require("dotenv").config({ path: localEnvPath, override: true });

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "sigea_senac",
  synchronize: process.env.DB_SYNC !== "false",
  logging: process.env.DB_LOGGING === "true",
  charset: "utf8mb4",
  entities: [Usuario, Sala, Turma, Alocacao, Coordenador, Unidade, Professor],
  migrations: [],
  subscribers: [],
});
