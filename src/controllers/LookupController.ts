import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { EntityTarget, ObjectLiteral } from "typeorm";

// Controller genérico reutilizado por unidades, segmentos, salas,
// instrutores e coordenadores — todas seguem o mesmo padrão simples de CRUD.
export class LookupController<T extends ObjectLiteral> {
  constructor(private entity: EntityTarget<T>) {}

  private repo() {
    return AppDataSource.getRepository(this.entity);
  }

  listar = async (_req: Request, res: Response) => {
    const registros = await this.repo().find();
    res.json(registros);
  };

  criar = async (req: Request, res: Response) => {
    try {
      const registro = this.repo().create(req.body);
      const salvo = await this.repo().save(registro);
      res.status(201).json(salvo);
    } catch (err: any) {
      res.status(400).json({ erro: err.message });
    }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.repo().update(id, req.body);
      const atualizado = await this.repo().findOneBy({ id } as any);
      res.json(atualizado);
    } catch (err: any) {
      res.status(400).json({ erro: err.message });
    }
  };

  remover = async (req: Request, res: Response) => {
    await this.repo().delete(Number(req.params.id));
    res.status(204).send();
  };
}
