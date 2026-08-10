import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { AppDataSource } from "../data-source";
import { Classroom } from "../entities/classroom";
import { EditorSettings } from "typescript";

export class ClassroomService {
  private readonly classRepo: Repository<Classroom>;

  constructor() {
    this.classRepo = AppDataSource.getRepository(Classroom);
  }

  async create(name: string, number: number, floor: number, capacity: number, reg_number: number): Promise<Classroom> {
    const classroom = this.classRepo.create({
      name,
      number,
      floor,
      capacity,
      reg_number
    });
    return await this.classRepo.save(classroom);
  }

  async getAll(): Promise<Classroom[]> {
    return await this.classRepo.find();
  }

  async getPagination(page : number): Promise<Classroom[]>{
    const results : number = 10;
    if(!page)
	page = 0;

    return await this.classRepo.createQueryBuilder().limit(results).offset(results * page).getMany();
  }
  
  async getOne(id: number): Promise<Classroom | null> {
    return await this.classRepo.findOne({where:{id: id}});
  }

  async deleteClass(number:number): Promise<DeleteResult>{
      return await this.classRepo.delete({number})
  }
  async editClass(id: number, name: string, number: number, floor: number, capacity: number, reg_number: number): Promise<Classroom> {
      const classroom = await this.getOne(id);
      classroom.name = name;
      classroom.number = number;
      classroom.floor = floor;
      classroom.capacity = capacity;
      classroom.reg_number = reg_number;

      return await this.classRepo.save(classroom);
  }
}
