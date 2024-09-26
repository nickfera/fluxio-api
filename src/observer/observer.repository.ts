import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, FindOptionsWhere, Repository } from "typeorm";
import { ObserverEntity } from "./observer.entity";

@Injectable()
export class ObserverRepository {
  constructor(
    @InjectRepository(ObserverEntity)
    readonly repository: Repository<ObserverEntity>,
  ) {}

  async save(entity: DeepPartial<ObserverEntity>): Promise<ObserverEntity> {
    return await this.repository.save(entity);
  }

  async findOne(
    where: FindOptionsWhere<ObserverEntity>,
  ): Promise<ObserverEntity | null> {
    return await this.repository.findOneBy(where);
  }

  async findMany(
    where: FindOptionsWhere<ObserverEntity>,
  ): Promise<ObserverEntity[]> {
    return await this.repository.findBy(where);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }
}
