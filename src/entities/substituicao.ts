import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
  } from "typeorm";
  import { Turma } from "./turma";
  import { Professor } from "./professor";
  
  @Entity({ name: "substituicoes" })
  export class Substituicao {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => Turma, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "course_id" })
    course: Turma;
  
    // O dia específico em que houve a substituição (não um período — é uma
    // ocorrência pontual, ex.: professor titular ficou doente só naquele dia).
    @Column({ type: "date" })
    date: string;
  
    // Quem deveria ter dado aula naquele dia. Guardado mesmo que a turma já
    // tenha um professor cadastrado, pois esse professor pode mudar depois e
    // o histórico da substituição não deve mudar retroativamente.
    @ManyToOne(() => Professor, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "original_teacher_id" })
    originalTeacher: Professor | null;
  
    // Quem efetivamente deu aula naquele dia.
    @ManyToOne(() => Professor, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "substitute_teacher_id" })
    substituteTeacher: Professor;
  
    @Column({ length: 255, nullable: true })
    reason: string | null;
  
    @Column({ type: "text", nullable: true })
    notes: string | null;
  
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
  }