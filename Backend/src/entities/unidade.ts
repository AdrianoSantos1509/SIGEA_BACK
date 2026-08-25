import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Sala } from "./sala";
import { Turma } from "./turma";

@Entity("buildings")
export class Unidade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 40, unique: true })
  code: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 180, nullable: true })
  location: string | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Sala, (sala) => sala.building)
  classrooms: Sala[];

  @OneToMany(() => Turma, (turma) => turma.building)
  courses: Turma[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
