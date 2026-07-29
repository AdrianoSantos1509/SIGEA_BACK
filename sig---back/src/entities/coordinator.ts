import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

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
       
       @CreateDateColumn()
       createdAt: Date;
}