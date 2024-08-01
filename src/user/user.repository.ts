import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity";
import {
  DeepPartial,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from "typeorm";

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(entity: DeepPartial<UserEntity>): Promise<UserEntity> {
    return await this.repository.save(entity);
  }

  async findOne(
    where: FindOptionsWhere<UserEntity> | FindOptionsWhere<UserEntity>[],
    relations?: FindOptionsRelations<UserEntity>,
  ): Promise<UserEntity | null> {
    return await this.repository.findOne({ where, relations });
  }
}
