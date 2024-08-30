import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AreaEntity } from "./area.entity";
import { AreaRepository } from "./area.repository";
import { AreaService } from "./area.service";
import { AreaController } from "./area.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity])],
  providers: [AreaRepository, AreaService],
  controllers: [AreaController],
  exports: [],
})
export class AreaModule {}
