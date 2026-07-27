import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Turma } from "./Turma";
import { Instrutor } from "./Instrutor";

@Entity("substituicoes")
@Unique(["turma", "dataSubstituicao", "instrutorNovo"])
export class Substituicao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Turma, (turma) => turma.substituicoes, { nullable: false })
  @JoinColumn({ name: "turma_id" })
  turma: Turma;

  @ManyToOne(() => Instrutor, (instrutor) => instrutor.substituicoesSaida, {
    nullable: true,
  })
  @JoinColumn({ name: "instrutor_anterior_id" })
  instrutorAnterior: Instrutor;

  @ManyToOne(() => Instrutor, (instrutor) => instrutor.substituicoesEntrada, {
    nullable: false,
  })
  @JoinColumn({ name: "instrutor_novo_id" })
  instrutorNovo: Instrutor;

  @Column({ name: "data_substituicao", type: "date" })
  dataSubstituicao: Date;

  @Column({ name: "mes_referencia" })
  mesReferencia: string; // ex: JAN26, FEV26

  @Column({ type: "text", nullable: true })
  motivo: string;
}
