import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Building {
       @PrimaryGeneratedColumn()
       id: number;
       
       @Column({length: 50})
       name: string;

       @Column()
       location: string;

       @CreateDateColumn()
       createdAt: Date;
}