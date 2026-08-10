import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { Classroom } from "./classroom";
import { Course } from "./course";

@Entity()
export class Occupancy {
       @PrimaryGeneratedColumn()
       id: number;

       @Column()
       date: Date;

       @Column({nullable: true})
       details: string;

       @ManyToOne(()=>Classroom)
       classroom: Classroom;

       @ManyToOne(()=>Course)
       course: Course;

       @CreateDateColumn()
       createdAt: Date;
}