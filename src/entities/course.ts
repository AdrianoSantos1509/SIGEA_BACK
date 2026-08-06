import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Coordinator } from "./coordinator";

@Entity()
export class Course {
       @PrimaryGeneratedColumn()
       id: number;
       
       @Column("varchar", {length: 80})
       name: string;
       
       @Column("varchar", { length: 18, unique: true })
       code: string;

       @Column()
       start: Date;

       @Column()
       end: Date;

       @Column()
       duration: number;

       @Column("enum", { enum: ["matutino, vespertino, noturno"] })
       shift: string;

       @Column()
       students: number;

       @Column()
       reg_number: number;

       @ManyToMany(()=>Coordinator, (coordinator)=>coordinator.course, {cascade:true})
       @JoinTable({name:"course_coordinator"})       
       coordinator: Coordinator[];

       @CreateDateColumn()
       createdAt: Date;
}