import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { AreaRepository } from "./area.repository";
import { TCreateArea } from "./schema/createArea.schema";
import { TUpdateArea } from "./schema/updateArea.schema";
import { AreaEntity } from "./area.entity";

@Injectable()
export class AreaService {
  private readonly logger = new Logger(AreaService.name);

  constructor(private readonly areaRepository: AreaRepository) {}

  async create(createArea: TCreateArea, userId: number): Promise<AreaEntity> {
    this.logger.debug(
      `Creating new area ${createArea.name} of user ${userId}...`,
    );

    const areaNameUsed = await this.areaRepository.findOne({
      name: createArea.name.trim(),
      userId,
    });

    if (areaNameUsed) {
      throw new ConflictException("An area with this name already exists.");
    }

    return await this.areaRepository.save({ ...createArea, userId });
  }

  async findOne(id: number, userId?: number): Promise<AreaEntity> {
    this.logger.debug(`Searching for area ${id}...`);

    const area = await this.areaRepository.findOne({ id });

    if (!area) {
      throw new NotFoundException("Area not found.");
    }

    if (userId && userId !== area.userId) {
      throw new ForbiddenException(
        "You do not have permissions to access this resource.",
      );
    }

    return area;
  }

  async update(
    id: number,
    updateArea: TUpdateArea,
    userId?: number,
  ): Promise<AreaEntity> {
    this.logger.debug(`Updating area ${id}...`);

    const area = await this.areaRepository.findOne({ id });

    if (!area) {
      throw new NotFoundException("Area not found.");
    }

    if (userId && userId !== area.userId) {
      this.logger.warn(
        `Attempt to update area of different user. Area: ${area.id}; User: ${userId}.`,
      );

      throw new NotFoundException("Area not found.");
    }

    if (updateArea.name && updateArea.name !== area.name) {
      const areaNameUsed = await this.areaRepository.findOne({
        name: updateArea.name.trim(),
        userId: area.userId,
      });

      if (areaNameUsed) {
        throw new ConflictException("An area with this name already exists.");
      }

      area.name = updateArea.name.trim();
    }

    if (typeof updateArea.active === "boolean") {
      area.active = updateArea.active;
    }

    return await this.areaRepository.save(area);
  }

  async softDelete(id: number, userId?: number): Promise<void> {
    this.logger.debug(`Deleting area ${id} (soft delete)...`);

    const area = await this.areaRepository.findOne({ id });

    if (!area) {
      throw new NotFoundException("Area not found.");
    }

    if (userId && userId !== area.userId) {
      this.logger.warn(
        `Attempt to delete (soft delete) area of different user. Area: ${area.id}; User: ${userId}.`,
      );

      throw new NotFoundException("Area not found.");
    }

    area.deletedAt = new Date(Date.now()).toISOString();

    await this.areaRepository.save(area);
  }
}
