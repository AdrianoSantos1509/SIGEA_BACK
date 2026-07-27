import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Turma } from "./Turma";

@Entity("coordenadores")
export class Coordenador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @OneToMany(() => Turma, (turma) => turma.coordenador)
  turmas: Turma[];
}
