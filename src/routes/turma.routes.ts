import { Router } from "express";
import { TurmaController } from "../controllers/TurmaController";

const router = Router();
const controller = new TurmaController();

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.delete("/:id", controller.remover);

export default router;
