import { Request } from "express";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
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
import { TValidatedUser } from "../auth/auth.service";
import { AuthGuard } from "../auth/guard/auth.guard";
import { LocalAuthGuard } from "../auth/guard/localAuth.guard";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(LocalAuthGuard)
  @Post("/login")
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request) {
    return req.user;
  }

  @Get("/logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request) {
    req.session.destroy(() => {});

    return;
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createUserPublicSchema, "body"))
  async create(@Body() createUser: TCreateUserPublicSchema) {
    return await this.userService.create(createUser);
  }

  @UseGuards(AuthGuard)
  @Get("")
  async getAuthenticated(@Req() req: Request & { user: TValidatedUser }) {
    return req.user;
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
