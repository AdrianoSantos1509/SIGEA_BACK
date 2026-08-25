import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Sala } from "./sala";
import { Turma } from "./turma";

@Entity("occupancies")
export class Alocacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180 })
  title: string;

  @Column({ length: 30, default: "TURMA" })
  kind: string;

  @Column({ length: 30, default: "ATIVA" })
  status: string;

  @Column({ type: "date" })
  startDate: string;

  @Column({ type: "date" })
  endDate: string;

  @Column({ type: "time" })
  startTime: string;

  @Column({ type: "time" })
  endTime: string;

  @Column({ type: "simple-json" })
  weekdays: string[];

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @ManyToOne(() => Sala, (sala) => sala.occupancies, { nullable: false, onDelete: "CASCADE" })
  classroom: Sala;

  @ManyToOne(() => Turma, (turma) => turma.occupancies, { nullable: true, onDelete: "CASCADE" })
  course: Turma | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
