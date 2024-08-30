import { Injectable } from "@nestjs/common";
import {
  DeepPartial,
  FindOptionsRelations,
  FindOptionsWhere,
  Repository,
} from "typeorm";
import { AreaEntity } from "./area.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AreaRepository {
  constructor(
    @InjectRepository(AreaEntity)
    private readonly repository: Repository<AreaEntity>,
  ) {}

  async save(entity: DeepPartial<AreaEntity>): Promise<AreaEntity> {
    return await this.repository.save(entity);
  }

  async findOne(
    where: FindOptionsWhere<AreaEntity> | FindOptionsWhere<AreaEntity>[],
    relations?: FindOptionsRelations<AreaEntity>,
  ): Promise<AreaEntity | null> {
    return await this.repository.findOne({ where, relations });
  }

  async findMany(
    where: FindOptionsWhere<AreaEntity> | FindOptionsWhere<AreaEntity>[],
    relations?: FindOptionsRelations<AreaEntity>,
  ): Promise<[AreaEntity[], number]> {
    return await this.repository.findAndCount({ where, relations });
  }
}
