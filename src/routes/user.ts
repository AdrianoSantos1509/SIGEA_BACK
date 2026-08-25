import { Router } from "express";
import { UserController } from "../controllers/user";
import { requireAdmin, requireAuth, requirePasswordCurrent } from "../middleware/token.middleware";

const controller = new UserController();
const UserRoutes = Router();

UserRoutes.post("/login", (req, res) => void controller.checkUser(req, res));
UserRoutes.post("/change-password", requireAuth, (req, res) => void controller.changePassword(req, res));
UserRoutes.post("", requireAuth, requirePasswordCurrent, requireAdmin, (req, res) => void controller.create(req, res));

export { UserRoutes };
