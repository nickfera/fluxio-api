import { UserEntity } from "src/user/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

export type TUserVerificationType = "email" | "phone";

@Entity("user_verification")
export class UserVerificationEntity {
  @PrimaryColumn({ name: "id", type: "int", generated: "increment" })
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: string;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt?: string | null;

  @Column({
    name: "user_id",
    type: "int",
    nullable: false,
  })
  userId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "user_id" })
  user?: UserEntity;

  @Column({
    name: "verification_type",
    type: "varchar",
    length: 5,
    nullable: false,
  })
  verificationType: TUserVerificationType;

  @Column({
    name: "token_hash",
    type: "varchar",
    nullable: true,
  })
  tokenHash: string | null;

  @Column({
    name: "expires_at",
    type: "datetime",
    nullable: false,
  })
  expiresAt: string;

  @Column({
    name: "is_verified",
    type: "tinyint",
    width: 1,
    default: false,
    unsigned: true,
    nullable: false,
  })
  isVerified: boolean;
}
