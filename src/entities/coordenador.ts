import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("people")
export class Coordenador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 30, nullable: true })
  cellphone: string | null;

  @Column({ length: 30, default: "COORDENADOR" })
  role: string;

  @Column({ length: 120, nullable: true })
  email: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
