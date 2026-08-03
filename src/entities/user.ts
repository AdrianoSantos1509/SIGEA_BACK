import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
       @PrimaryGeneratedColumn()
       id: number;
       
       @Column("varchar", {length: 80})
       name: string;
       
       @Column("varchar", { length: 80 })
       email: string;

       @Column("varchar", {length: 72})
       password: string;

       @Column()
       reg_number: number;

       @CreateDateColumn()
       createdAt: Date;
}