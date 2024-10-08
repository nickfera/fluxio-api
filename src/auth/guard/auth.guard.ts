import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    if (
      !request.isAuthenticated() ||
      !request.user ||
      request.user.pendingUserVerifications
    ) {
      return false;
    }

    return true;
  }
}
