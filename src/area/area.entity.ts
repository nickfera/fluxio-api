import { UserEntity } from "src/user/user.entity";
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

@Entity("area")
export class AreaEntity {
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
    name: "user_id",
    type: "int",
    nullable: false,
  })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.areas)
  @JoinColumn({ name: "user_id" })
  user?: UserEntity;
}
