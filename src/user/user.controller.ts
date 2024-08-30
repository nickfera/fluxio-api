import { Request } from "express";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { ZodValidationPipe } from "src/common/pipe/zodValidation.pipe";
import { LocalAuthGuard } from "src/auth/guard/localAuth.guard";
import { AuthUnverifiedGuard } from "src/auth/guard/authUnverified.guard";
import { AuthGuard } from "src/auth/guard/auth.guard";
import { TUser, User } from "src/common/decorators";
import {
  createUserPublicSchema,
  TCreateUserPublicSchema,
} from "./schema/createUser.schema";
import {
  TUpdateAuthenticatedUserSchema,
  updateAuthenticatedUserSchema,
} from "./schema/updateUser.schema";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("/login")
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(@User() user: TUser) {
    return user;
  }

  @Get("/logout")
  @UseGuards(AuthUnverifiedGuard)
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

  @Get("")
  @UseGuards(AuthUnverifiedGuard)
  async getAuthenticated(@User() user: TUser) {
    return user;
  }

  @Patch()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(updateAuthenticatedUserSchema, "body"))
  async update(
    @User() user: TUser,
    @Body() updateUser: TUpdateAuthenticatedUserSchema,
  ) {
    return await this.userService.update(user.id, updateUser);
  }
}
