import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Unidade } from "./unidade";
import { Alocacao } from "./alocacao";
import { Professor } from "./professor";

@Entity("courses")
export class Turma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  code: string;

  @Column({ length: 220 })
  name: string;

  @Column({ length: 80, nullable: true })
  abbreviation: string | null;

  @Column({ default: 0 })
  workload: number;

  @Column({ length: 120, nullable: true })
  segment: string | null;

  @Column({ length: 50, default: "Turma" })
  type: string;

  @Column({ type: "date", nullable: true })
  startDate: string | null;

  @Column({ type: "date", nullable: true })
  endDate: string | null;

  @Column({ length: 30, nullable: true })
  shift: string | null;

  @Column({ type: "time", nullable: true })
  startTime: string | null;

  @Column({ type: "time", nullable: true })
  endTime: string | null;

  @Column({ type: "simple-json", nullable: true })
  weekdays: string[] | null;

  @Column({ default: 0 })
  students: number;

  @Column({ length: 60, default: "Em andamento" })
  status: string;

  @Column({ length: 160, nullable: true })
  instructor: string | null;

  @ManyToOne(() => Professor, (professor) => professor.courses, { nullable: true, onDelete: "SET NULL" })
  teacher: Professor | null;

  @Column({ length: 160, nullable: true })
  coordinator: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @ManyToOne(() => Unidade, (unidade) => unidade.courses, { nullable: true, onDelete: "SET NULL" })
  building: Unidade | null;

  @OneToMany(() => Alocacao, (alocacao) => alocacao.course)
  occupancies: Alocacao[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
