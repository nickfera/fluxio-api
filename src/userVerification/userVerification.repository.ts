import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, FindOptionsWhere, Repository } from "typeorm";
import { UserVerificationEntity } from "./userVerification.entity";

@Injectable()
export class UserVerificationRepository {
  constructor(
    @InjectRepository(UserVerificationEntity)
    private readonly repository: Repository<UserVerificationEntity>,
  ) {}

  async save(
    entity: DeepPartial<UserVerificationEntity>,
  ): Promise<UserVerificationEntity> {
    return await this.repository.save(entity);
  }

  async findOne(
    where:
      | FindOptionsWhere<UserVerificationEntity>
      | FindOptionsWhere<UserVerificationEntity>[],
  ): Promise<UserVerificationEntity | null> {
    return await this.repository.findOne({ where });
  }
}
