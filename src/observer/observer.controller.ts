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
import { AuthGuard } from "src/auth/guard/auth.guard";
import { ZodValidationPipe } from "src/common/pipe/zodValidation.pipe";
import { TUser, User } from "src/common/decorators";
import { ObserverService } from "./observer.service";
import {
  createObserverSchema,
  TCreateObserver,
} from "./schema/createObserver.schema";
import {
  TUpdateObserver,
  updateObserverSchema,
} from "./schema/updateObserver.schema";

@Controller("observer")
@UseGuards(AuthGuard)
export class ObserverController {
  constructor(private readonly observerService: ObserverService) {}

  @Post("")
  @UsePipes(new ZodValidationPipe(createObserverSchema, "body"))
  async create(@User() user: TUser, @Body() createObserver: TCreateObserver) {
    return await this.observerService.create(createObserver, user.id);
  }

  @Get(":id")
  async findOne(@User() user: TUser, @Param("id") id: string) {
    return await this.observerService.findOne({
      id: +id,
      area: { userId: user.id },
    });
  }

  @Get("area/:areaId")
  async findMany(@User() user: TUser, @Param("areaId") areaId: string) {
    return await this.observerService.findMany(+areaId, user.id);
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(updateObserverSchema, "body"))
  async update(
    @User() user: TUser,
    @Param("id") id: string,
    @Body() updateObserver: TUpdateObserver,
  ) {
    return await this.observerService.update(+id, updateObserver, user.id);
  }

  @Delete(":id")
  async softDelete(@User() user: TUser, @Param("id") id: string) {
    return await this.observerService.softDelete(+id, user.id);
  }
}
