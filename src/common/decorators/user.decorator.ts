import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { TValidatedUser } from "src/auth/auth.service";

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

export type TUser = TValidatedUser;
