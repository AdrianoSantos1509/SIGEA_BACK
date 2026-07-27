import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Turma } from "./Turma";

@Entity("segmentos")
export class Segmento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @OneToMany(() => Turma, (turma) => turma.segmento)
  turmas: Turma[];
}
