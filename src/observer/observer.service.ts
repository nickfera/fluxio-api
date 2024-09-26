import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ObserverRepository } from "./observer.repository";
import { TCreateObserver } from "./schema/createObserver.schema";
import { ObserverEntity } from "./observer.entity";
import { AreaService } from "src/area/area.service";
import { FindOptionsWhere, Not } from "typeorm";
import { TUpdateObserver } from "./schema/updateObserver.schema";

@Injectable()
export class ObserverService {
  private readonly logger = new Logger(ObserverService.name);

  constructor(
    private readonly observerRepository: ObserverRepository,
    private readonly areaService: AreaService,
  ) {}

  async create(
    createObserver: TCreateObserver,
    userId?: number,
  ): Promise<ObserverEntity> {
    this.logger.debug(
      `Creating observer '${createObserver.name}' for area ${createObserver.areaId}`,
    );

    await this.areaService.findOne(createObserver.areaId, userId);

    const observerWithNameExists = await this.observerRepository.findOne({
      name: createObserver.name,
      areaId: createObserver.areaId,
    });

    if (observerWithNameExists) {
      throw new ConflictException("An observer with this name already exists.");
    }

    return await this.observerRepository.save(createObserver);
  }

  async findOne(
    where: FindOptionsWhere<ObserverEntity>,
  ): Promise<ObserverEntity> {
    this.logger.debug(`Searching for observer...`);

    const observer = await this.observerRepository.findOne(where);

    if (!observer) {
      throw new NotFoundException("Observer not found");
    }

    return observer;
  }

  async findMany(areaId: number, userId?: number): Promise<ObserverEntity[]> {
    this.logger.debug(`Searching for observer of areaId ${areaId}...`);

    const where: Parameters<ObserverRepository["findMany"]>[0] = {
      areaId,
    };

    if (userId) {
      where.area = {
        userId,
      };
    }

    return await this.observerRepository.findMany(where);
  }

  async update(
    id: number,
    updateObserver: TUpdateObserver,
    userId?: number,
  ): Promise<ObserverEntity> {
    this.logger.debug(`Updating observer id ${id}...`);

    const where: Parameters<ObserverService["findOne"]>[0] = {
      id,
    };

    if (userId) {
      where.area = { userId };
    }

    const observer = await this.findOne(where);

    if (updateObserver.name && updateObserver.name !== observer.name) {
      const observerWithNameExists = await this.observerRepository.findOne({
        id: Not(id),
        areaId: observer.areaId,
        name: updateObserver.name,
      });

      if (observerWithNameExists) {
        throw new ConflictException(
          "An observer with the same name in the area already exists.",
        );
      }
    }

    return this.observerRepository.save({ ...observer, ...updateObserver });
  }

  async softDelete(id: number, userId?: number): Promise<void> {
    this.logger.debug(`Deleting (soft delete) observer id ${id}...`);

    const where: Parameters<ObserverService["findOne"]>[0] = {
      id,
    };

    if (userId) {
      where.area = { userId };
    }

    await this.findOne(where);

    await this.observerRepository.softDelete(id);
  }
}
