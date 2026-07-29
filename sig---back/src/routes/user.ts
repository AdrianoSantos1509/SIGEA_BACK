import { Router } from "express";
import { UserController } from "../controllers/user";

const userController = new UserController();

const UserRoutes = Router();

UserRoutes.post("", (req, res) => {userController.create(req,res)});
UserRoutes.post("/login", (req, res) => {userController.checkUser(req, res)});

export { UserRoutes };