import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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

       @CreateDateColumn()
       createdAt: Date;
}