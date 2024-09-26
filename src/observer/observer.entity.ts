import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { AreaEntity } from "src/area/area.entity";

@Entity("observer")
export class ObserverEntity {
  @PrimaryColumn({ name: "id", type: "int", generated: "increment" })
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: string;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt?: string | null;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt?: string | null;

  @Column({
    name: "name",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  name: string;

  @Column({
    name: "active",
    type: "tinyint",
    width: 1,
    nullable: false,
    default: 1,
  })
  active: boolean;

  @Column({
    name: "area_id",
    type: "int",
    nullable: false,
  })
  areaId: number;

  @ManyToOne(() => AreaEntity)
  @JoinColumn({ name: "area_id" })
  area?: AreaEntity;
}
