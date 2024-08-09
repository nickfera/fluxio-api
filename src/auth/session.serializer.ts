import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { TValidatedUser } from "./auth.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(
    user: TValidatedUser,
    done: (err: Error | null, user: TValidatedUser) => void,
  ): any {
    done(null, user);
  }

  deserializeUser(
    payload: any,
    done: (err: Error | null, payload: string) => void,
  ): any {
    done(null, payload);
  }
}
