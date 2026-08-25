import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Unidade } from "./unidade";
import { Alocacao } from "./alocacao";

@Entity("classrooms")
@Unique(["building", "code"])
export class Sala {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  code: string;

  @Column({ length: 140 })
  name: string;

  @Column({ length: 30, nullable: true })
  floor: string | null;

  @Column({ default: 0 })
  capacity: number;

  @Column({ default: 0 })
  recommendedCapacity: number;

  @Column({ length: 80, default: "Sala de aula" })
  type: string;

  @Column({ type: "simple-json", nullable: true })
  resources: string[] | null;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Unidade, (unidade) => unidade.classrooms, { nullable: false, onDelete: "CASCADE" })
  building: Unidade;

  @OneToMany(() => Alocacao, (alocacao) => alocacao.classroom)
  occupancies: Alocacao[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
