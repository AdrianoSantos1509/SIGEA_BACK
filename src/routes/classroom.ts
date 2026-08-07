import { Router } from "express";
import { ClassroomController } from "../controllers/classroom.controller";

const classroomController = new ClassroomController();
const ClassRoutes = Router();

ClassRoutes.post("/", (req, res) => classroomController.create(req, res));
ClassRoutes.get("/", (req, res) => classroomController.getAllClassroom(req, res));
ClassRoutes.get("/:number", (req, res) => classroomController.getOneClassroom(req, res));
ClassRoutes.put("/:number", (req, res) => classroomController.editClass(req, res));
ClassRoutes.delete("/:number", (req, res) => classroomController.deleteClass(req, res));

export { ClassRoutes };
