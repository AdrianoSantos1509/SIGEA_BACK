import {Request,Response } from "express";
import { ClassroomService } from "../services/classroom.service";

const classroomService = new ClassroomService();

export class ClassroomController {
    async create(req:Request,res:Response):Promise<Response> {
        const { number, floor, capacity, reg_number, createdAt } = req.body;
        const classroom = await classroomService.create(number, floor, capacity, reg_number, createdAt);
        return res.json(classroom);
    }

    async getAllClassroom(req:Request,res:Response):Promise<Response> {
        const classrooms = await classroomService.getAll();
        return res.json(classrooms);
    }

    async getOneClassroom(req:Request,res:Response):Promise<Response> {
        const { number } = req.params;
        const classroom = await classroomService.getOne(Number(number));
        
        if (!classroom) {
            return res.status(404).json({ message: "Sala de aula não encontrada." });
        }
        
        return res.json(classroom);
    }

    async deleteClass(req:Request,res:Response):Promise<Response> {
        const { number } = req.params;
        const result = await classroomService.deleteClass(Number(number));
        
        if (result.affected === 0) {
            return res.status(404).json({ message: "Sala de aula não encontrada para exclusão." });
        }
        
        return res.status(204).send();
    }
    async editClass(req: Request, res: Response): Promise<Response> {
        const { number } = req.params;
        const updateData = req.body;
        const result = await classroomService.editClass(Number(number), updateData);
        
        if (result.affected === 0) {
            return res.status(404).json({ message: "Sala de aula não encontrada para edição." });
        }
        
        return res.json({ message: "Sala de aula editada com sucesso" });
    }
}
