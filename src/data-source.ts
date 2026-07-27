import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Unidade } from "./entities/Unidade";
import { Segmento } from "./entities/Segmento";
import { Sala } from "./entities/Sala";
import { Instrutor } from "./entities/Instrutor";
import { Coordenador } from "./entities/Coordenador";
import { Turma } from "./entities/Turma";
import { TurmaDia } from "./entities/TurmaDia";
import { Uc } from "./entities/Uc";
import { Substituicao } from "./entities/Substituicao";
import { PendenciaAlocacao } from "./entities/PendenciaAlocacao";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "senac",
  database: process.env.DB_DATABASE || "sistema_turmas_cep",
  synchronize: true, // trocar para migrations quando for pra produção
  logging: false,
  entities: [
    Unidade,
    Segmento,
    Sala,
    Instrutor,
    Coordenador,
    Turma,
    TurmaDia,
    Uc,
    Substituicao,
    PendenciaAlocacao,
  ],
  migrations: [],
  subscribers: [],
});
