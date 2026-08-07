import { DeleteResult, Repository, UpdateResult } from "typeorm";
import { AppDataSource } from "../data-source";
import { Classroom } from "../entities/classroom";
import { EditorSettings } from "typescript";

export class ClassroomService {
  private readonly classRepo: Repository<Classroom>;

  constructor() {
    this.classRepo = AppDataSource.getRepository(Classroom);
  }

  async create(number: number, floor: number, capacity: number, reg_number: number, createdAt: Date): Promise<Classroom> {
    const classroom = this.classRepo.create({
      number,
      floor,
      capacity,
      reg_number,
      createdAt
    });
    return await this.classRepo.save(classroom);
  }

  async getAll(): Promise<Classroom[]> {
    return await this.classRepo.find();
  }

  async getOne(number: number): Promise<Classroom | null> {
    return await this.classRepo.findOneBy({ number });
  }

  async deleteClass(number:number): Promise<DeleteResult>{
      return await this.classRepo.delete({number})
  }
  async editClass(<number:number,data:Partial<Classroom>): Promise<UpdateResult> {
      return await this.classRepo.update({number},data)
  }
}
