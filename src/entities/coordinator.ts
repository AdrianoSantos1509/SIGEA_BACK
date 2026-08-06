import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from "typeorm";
import { Course } from "./course";

@Entity()
export class Coordinator {
       @PrimaryGeneratedColumn()
       id: number;
       
       @Column()
       name: string;

       @Column()
       cellphone: number;
       
       @Column("enum", { enum: ["instrutor, coordenador, assistente"] })
       role: string;

       @ManyToMany(()=>Course)
       course: Course[];

       @CreateDateColumn()
       createdAt: Date;
}