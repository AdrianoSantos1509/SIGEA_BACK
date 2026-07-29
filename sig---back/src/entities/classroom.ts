import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Classroom {
       @PrimaryGeneratedColumn()
       id: number;
       
       @Column()
       name: number;
       
       @Column()
       number: number;
       
       @Column()
       floor: number;
       
       @Column()
       capacity: number;
       
       @Column()
       reg_number: number;

       @CreateDateColumn()
       createdAt: Date;       
}