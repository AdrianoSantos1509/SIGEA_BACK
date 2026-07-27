import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Turma } from "../entities/Turma";

const repo = () => AppDataSource.getRepository(Turma);

export class TurmaController {
  async listar(req: Request, res: Response) {
    const { status, turno, segmento } = req.query;

    const qb = repo()
      .createQueryBuilder("turma")
      .leftJoinAndSelect("turma.unidade", "unidade")
      .leftJoinAndSelect("turma.segmento", "segmento")
      .leftJoinAndSelect("turma.sala", "sala")
      .leftJoinAndSelect("turma.instrutor", "instrutor")
      .leftJoinAndSelect("turma.coordenador", "coordenador");

    if (status) qb.andWhere("turma.status = :status", { status });
    if (turno) qb.andWhere("turma.turno = :turno", { turno });
    if (segmento) qb.andWhere("segmento.nome = :segmento", { segmento });

    const turmas = await qb.getMany();
    res.json(turmas);
  }

  async buscarPorId(req: Request, res: Response) {
    const turma = await repo().findOne({
      where: { id: Number(req.params.id) },
      relations: [
        "unidade",
        "segmento",
        "sala",
        "instrutor",
        "coordenador",
        "dias",
        "ucs",
        "substituicoes",
        "pendenciasAlocacao",
      ],
    });

    if (!turma) {
      return res.status(404).json({ erro: "Turma não encontrada" });
    }

    res.json(turma);
  }

  async criar(req: Request, res: Response) {
    try {
      const turma = repo().create(req.body);
      const salva = await repo().save(turma);
      res.status(201).json(salva);
    } catch (err: any) {
      res.status(400).json({ erro: err.message });
    }
  }

  async atualizar(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await repo().update(id, req.body);
      const atualizada = await repo().findOneBy({ id });
      res.json(atualizada);
    } catch (err: any) {
      res.status(400).json({ erro: err.message });
    }
  }

  async remover(req: Request, res: Response) {
    await repo().delete(Number(req.params.id));
    res.status(204).send();
  }
}
