import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Unidade } from "./Unidade";
import { Segmento } from "./Segmento";
import { Sala } from "./Sala";
import { Instrutor } from "./Instrutor";
import { Coordenador } from "./Coordenador";
import { TurmaDia } from "./TurmaDia";
import { Uc } from "./Uc";
import { Substituicao } from "./Substituicao";
import { PendenciaAlocacao } from "./PendenciaAlocacao";

export enum SiglaTipo {
  FIC = "FIC",
  TECNICO = "TÉCNICO",
  APRENDIZAGEM = "Aprendizagem",
}

export enum Turno {
  MATUTINO = "Matutino",
  VESPERTINO = "Vespertino",
  NOTURNO = "Noturno",
  INTEGRAL = "Integral",
}

export enum StatusTurma {
  EM_ANDAMENTO = "em_andamento",
  PENDENTE = "pendente",
  CANCELADA = "cancelada",
  ENCERRADA = "encerrada",
}

@Entity("turmas")
export class Turma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string; // ex: 2026.08.27

  @Column()
  nome: string;

  @Column({ name: "carga_horaria" })
  cargaHoraria: number;

  @Column({ name: "sigla_tipo", type: "enum", enum: SiglaTipo })
  siglaTipo: SiglaTipo;

  @Column({ type: "enum", enum: Turno })
  turno: Turno;

  @Column({ name: "data_inicio", type: "date" })
  dataInicio: Date;

  @Column({ name: "data_termino", type: "date" })
  dataTermino: Date;

  @Column({
    type: "enum",
    enum: StatusTurma,
    default: StatusTurma.EM_ANDAMENTO,
  })
  status: StatusTurma;

  @Column({ name: "turma_flexivel", default: false })
  turmaFlexivel: boolean;

  @Column({ type: "text", nullable: true })
  observacoes: string;

  @ManyToOne(() => Unidade, (unidade) => unidade.turmas, { nullable: false })
  @JoinColumn({ name: "unidade_id" })
  unidade: Unidade;

  @ManyToOne(() => Segmento, (segmento) => segmento.turmas, { nullable: false })
  @JoinColumn({ name: "segmento_id" })
  segmento: Segmento;

  @ManyToOne(() => Sala, (sala) => sala.turmas, { nullable: true })
  @JoinColumn({ name: "sala_id" })
  sala: Sala;

  @ManyToOne(() => Instrutor, (instrutor) => instrutor.turmas, {
    nullable: true,
  })
  @JoinColumn({ name: "instrutor_id" })
  instrutor: Instrutor;

  @ManyToOne(() => Coordenador, (coordenador) => coordenador.turmas, {
    nullable: true,
  })
  @JoinColumn({ name: "coordenador_id" })
  coordenador: Coordenador;

  @OneToMany(() => TurmaDia, (dia) => dia.turma, { cascade: true })
  dias: TurmaDia[];

  @OneToMany(() => Uc, (uc) => uc.turma, { cascade: true })
  ucs: Uc[];

  @OneToMany(() => Substituicao, (sub) => sub.turma)
  substituicoes: Substituicao[];

  @OneToMany(() => PendenciaAlocacao, (pendencia) => pendencia.turma)
  pendenciasAlocacao: PendenciaAlocacao[];
}
