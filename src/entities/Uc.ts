import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Turma } from "./Turma";
import { Instrutor } from "./Instrutor";

@Entity("ucs")
@Unique(["turma", "numeroUc"])
export class Uc {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Turma, (turma) => turma.ucs, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "turma_id" })
  turma: Turma;

  @Column({ name: "numero_uc" })
  numeroUc: number; // 1 a 19

  @Column({ name: "data_prevista", type: "date", nullable: true })
  dataPrevista: Date;

  @Column({ name: "data_realizada", type: "date", nullable: true })
  dataRealizada: Date;

  @ManyToOne(() => Instrutor, (instrutor) => instrutor.ucs, { nullable: true })
  @JoinColumn({ name: "instrutor_id" })
  instrutor: Instrutor;

  @Column({ name: "observacao_sede", type: "text", nullable: true })
  observacaoSede: string;

  @Column({ name: "observacao_unidade", type: "text", nullable: true })
  observacaoUnidade: string;
}
