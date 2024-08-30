import { AreaEntity } from "src/area/area.entity";
import { UserVerificationEntity } from "src/userVerification/userVerification.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

export const UserRoles = ["admin", "owner", "user", "blocked"] as const;
export type TUserRole = (typeof UserRoles)[number];

@Entity("user")
export class UserEntity {
  @PrimaryColumn({ name: "id", type: "int", generated: "increment" })
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt: string;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt?: string | null;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime" })
  deletedAt?: string | null;

  @Column({
    name: "last_login_at",
    type: "datetime",
    nullable: true,
    default: null,
  })
  lastLoginAt?: string | null;

  @Column({
    name: "first_name",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  firstName: string;

  @Column({
    name: "last_name",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  lastName: string;

  @Column({
    name: "email",
    type: "varchar",
    length: 255,
    nullable: true,
    default: null,
  })
  email?: string | null;

  @Column({
    name: "phone_number",
    type: "varchar",
    length: 20,
    nullable: true,
    default: null,
  })
  phoneNumber?: string | null;

  @Column({
    name: "password",
    type: "varchar",
    length: "161",
    nullable: false,
  })
  password: string;

  @Column({
    name: "role",
    type: "varchar",
    length: "7",
    nullable: false,
  })
  role: TUserRole;

  @OneToMany(
    () => UserVerificationEntity,
    (userVerification) => userVerification.user,
  )
  userVerifications?: UserVerificationEntity[];

  @OneToMany(() => AreaEntity, (area) => area.user)
  areas?: AreaEntity[];
}
