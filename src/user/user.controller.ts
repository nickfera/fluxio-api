import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { ZodValidationPipe } from "../common/pipe/zod-validation.pipe";
import {
  createUserPublicSchema,
  TCreateUserPublicSchema,
} from "./schema/createUser.schema";
import {
  TUpdateUserSchema,
  updateUserSchema,
} from "./schema/updateUser.schema";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUserPublicSchema, "body"))
  async create(@Body() createUser: TCreateUserPublicSchema) {
    return await this.userService.create(createUser);
  }

  @Get(":id")
  async findOneById(@Param("id", ParseIntPipe) id: number) {
    return await this.userService.findOneById(id);
  }

  @Patch(":id")
  @UsePipes(new ZodValidationPipe(updateUserSchema, "body"))
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUser: TUpdateUserSchema,
  ) {
    return await this.userService.update(id, updateUser);
  }
}
