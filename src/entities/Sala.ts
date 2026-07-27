import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from "typeorm";
import { Unidade } from "./Unidade";
import { Turma } from "./Turma";

@Entity("salas")
@Unique(["codigo", "unidade"])
export class Sala {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string; // ex: B103

  @Column({ nullable: true })
  andar: string;

  @Column({ nullable: true })
  capacidade: number;

  @ManyToOne(() => Unidade, (unidade) => unidade.salas, { nullable: false })
  @JoinColumn({ name: "unidade_id" })
  unidade: Unidade;

  @OneToMany(() => Turma, (turma) => turma.sala)
  turmas: Turma[];
}
