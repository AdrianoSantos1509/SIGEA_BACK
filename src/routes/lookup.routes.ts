import { Router } from "express";
import { LookupController } from "../controllers/LookupController";
import { Unidade } from "../entities/Unidade";
import { Segmento } from "../entities/Segmento";
import { Sala } from "../entities/Sala";
import { Instrutor } from "../entities/Instrutor";
import { Coordenador } from "../entities/Coordenador";

function criarRotasLookup<T extends { id?: number }>(entity: any) {
  const controller = new LookupController<any>(entity);
  const router = Router();

  router.get("/", controller.listar);
  router.post("/", controller.criar);
  router.put("/:id", controller.atualizar);
  router.delete("/:id", controller.remover);

  return router;
}

export const unidadeRoutes = criarRotasLookup(Unidade);
export const segmentoRoutes = criarRotasLookup(Segmento);
export const salaRoutes = criarRotasLookup(Sala);
export const instrutorRoutes = criarRotasLookup(Instrutor);
export const coordenadorRoutes = criarRotasLookup(Coordenador);
