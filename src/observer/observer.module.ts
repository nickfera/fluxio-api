import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ObserverEntity } from "./observer.entity";
import { ObserverRepository } from "./observer.repository";
import { ObserverService } from "./observer.service";
import { AreaModule } from "src/area/area.module";
import { ObserverController } from "./observer.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ObserverEntity]), AreaModule],
  providers: [ObserverRepository, ObserverService],
  controllers: [ObserverController],
})
export class ObserverModule {}
