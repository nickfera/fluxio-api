import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { AreaService } from "./area.service";
import { AuthGuard } from "src/auth/guard/auth.guard";
import { ZodValidationPipe } from "src/common/pipe/zodValidation.pipe";
import { TUser, User } from "src/common/decorators";
import { createAreaSchema, TCreateArea } from "./schema/createArea.schema";
import { TUpdateArea, updateAreaSchema } from "./schema/updateArea.schema";

@Controller("area")
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post("")
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(createAreaSchema, "body"))
  async create(@User() user: TUser, @Body() createArea: TCreateArea) {
    return await this.areaService.create(createArea, user.id);
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  async findOne(@User() user: TUser, @Param("id") id: string) {
    return await this.areaService.findOne(+id, user.id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(updateAreaSchema, "body"))
  async update(
    @User() user: TUser,
    @Param("id") id: string,
    @Body() updateArea: TUpdateArea,
  ) {
    return await this.areaService.update(+id, updateArea, user.id);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  async softDelete(@User() user: TUser, @Param("id") id: string) {
    return await this.areaService.softDelete(+id, user.id);
  }
}
