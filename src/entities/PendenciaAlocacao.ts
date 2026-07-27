import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Turma } from "./Turma";

@Entity("pendencias_alocacao")
@Unique(["turma", "ucNumero"])
export class PendenciaAlocacao {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Turma, (turma) => turma.pendenciasAlocacao, {
    nullable: false,
  })
  @JoinColumn({ name: "turma_id" })
  turma: Turma;

  @Column({ name: "uc_numero" })
  ucNumero: number;

  @Column({ name: "instrutor_sugerido", nullable: true })
  instrutorSugerido: string;

  @Column({ name: "inicio_uc", type: "date", nullable: true })
  inicioUc: Date;

  @Column({ name: "turno_envio", nullable: true })
  turnoEnvio: string;

  @Column({ name: "data_envio", type: "date", nullable: true })
  dataEnvio: Date;

  @Column({ type: "text", nullable: true })
  observacao: string;
}
