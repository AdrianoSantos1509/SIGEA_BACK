import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Occupancy {
       @PrimaryGeneratedColumn()
       id: number;

       @Column()
       date: Date;

       @Column({nullable: true})
       details: string;

       @CreateDateColumn()
       createdAt: Date;
}