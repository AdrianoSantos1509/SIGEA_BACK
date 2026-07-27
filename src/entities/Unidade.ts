import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Sala } from "./Sala";
import { Turma } from "./Turma";

@Entity("unidades")
export class Unidade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nome: string;

  @Column({ nullable: true })
  endereco: string;

  @OneToMany(() => Sala, (sala) => sala.unidade)
  salas: Sala[];

  @OneToMany(() => Turma, (turma) => turma.unidade)
  turmas: Turma[];
}
