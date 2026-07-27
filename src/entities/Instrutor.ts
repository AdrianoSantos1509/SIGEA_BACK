import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Turma } from "./Turma";
import { Uc } from "./Uc";
import { Substituicao } from "./Substituicao";

export enum StatusInstrutor {
  ATIVO = "ativo",
  INATIVO = "inativo",
  SEM_INSTRUTOR = "sem_instrutor",
}

@Entity("instrutores")
export class Instrutor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @Column({
    type: "enum",
    enum: StatusInstrutor,
    default: StatusInstrutor.ATIVO,
  })
  status: StatusInstrutor;

  @OneToMany(() => Turma, (turma) => turma.instrutor)
  turmas: Turma[];

  @OneToMany(() => Uc, (uc) => uc.instrutor)
  ucs: Uc[];

  @OneToMany(() => Substituicao, (sub) => sub.instrutorAnterior)
  substituicoesSaida: Substituicao[];

  @OneToMany(() => Substituicao, (sub) => sub.instrutorNovo)
  substituicoesEntrada: Substituicao[];
}
