import { Request,Response } from "express";
import { ClassroomService } from "../services/classroom.service";

const classroomService = new ClassroomService();

export class ClassroomController {
    async create(req:Request,res:Response):Promise<Response> {
        const { name, number, floor, capacity, reg_number } = req.body;
        const classroom = await classroomService.create(name, number, floor, capacity, reg_number);
        return res.json(classroom);
    }

    async getAllClassroom(req:Request,res:Response):Promise<Response> {
        const classrooms = await classroomService.getAll();
        return res.json(classrooms);
    }

    async getPageClassroom(req:Request,res:Response):Promise<Response> {
    	const { page } = req.query;
        const classrooms = await classroomService.getPagination(page);
        return res.json(classrooms);
    }

    async getOneClassroom(req:Request,res:Response):Promise<Response> {
        const { id } = req.params;
        const classroom = await classroomService.getOne(Number(id));
        
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
        const { id, name, number, floor, capacity, reg_number } = req.body;
        const updateData = req.body;
        const result = await classroomService.editClass(id, name, number, floor, capacity, reg_number);
        
        if (result == null) {
            return res.status(404).json({ message: "Sala de aula não encontrada para edição." });
        }
        
        return res.json({ message: "Sala de aula editada com sucesso" });
    }
}
