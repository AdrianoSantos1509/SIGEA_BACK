import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 120, unique: true })
  email: string;

  @Column({ length: 72 })
  password: string;

  @Column({ length: 30, default: "COORDENADOR" })
  role: string;

  @Column({ length: 30, nullable: true })
  regNumber: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({ type: "datetime", nullable: true })
  passwordChangedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
