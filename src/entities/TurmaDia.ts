import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Turma } from "./Turma";

export enum DiaSemana {
  SEG = "SEG",
  TER = "TER",
  QUA = "QUA",
  QUI = "QUI",
  SEX = "SEX",
  SAB = "SAB",
}

@Entity("turma_dias")
@Unique(["turma", "diaSemana"])
export class TurmaDia {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Turma, (turma) => turma.dias, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "turma_id" })
  turma: Turma;

  @Column({ name: "dia_semana", type: "enum", enum: DiaSemana })
  diaSemana: DiaSemana;
}
