import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Turma } from "./turma";

@Entity("teachers")
export class Professor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  registration: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 140, nullable: true })
  email: string | null;

  @Column({ length: 30, nullable: true })
  phone: string | null;

  @Column({ length: 120, nullable: true })
  area: string | null;

  @Column({ length: 120, nullable: true })
  specialty: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Turma, (turma) => turma.teacher)
  courses: Turma[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
