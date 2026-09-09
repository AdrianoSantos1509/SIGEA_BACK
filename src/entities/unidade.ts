import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Sala } from "./sala";
import { Turma } from "./turma";

@Entity("buildings")
export class Unidade {
  @PrimaryGeneratedColumn()
  id: number;

  // Representa o CNPJ da instituição (armazenado apenas com dígitos, sem máscara).
  @Column({ length: 40, unique: true })
  code: string;

  @Column({ length: 120 })
  name: string;

  // Endereço completo da unidade (logradouro, número, bairro, cidade, UF).
  @Column({ length: 180, nullable: true })
  location: string | null;

  // CEP da unidade (armazenado apenas com dígitos, sem máscara).
  @Column({ length: 8, nullable: true })
  zipCode: string | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Sala, (sala) => sala.building)
  classrooms: Sala[];

  @OneToMany(() => Turma, (turma) => turma.building)
  courses: Turma[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
