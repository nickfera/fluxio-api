import { Injectable } from "@nestjs/common";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserEntity } from "../user/user.entity";
import { UserService } from "../user/user.service";

export type TValidatedUser = Omit<UserEntity, "password">;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly scryptService: ScryptService,
  ) {}

  async validateUser(
    emailOrPhoneNumber: string,
    password: string,
  ): Promise<TValidatedUser | null> {
    const isPhoneNumber = new RegExp(/^\d+$/g).test(emailOrPhoneNumber);

    const user = await this.userService
      .findOneBy(isPhoneNumber ? "phoneNumber" : "email", emailOrPhoneNumber)
      .catch(() => undefined);

    if (!user || !(await this.scryptService.verify(password, user.password))) {
      return null;
    }

    const { password: pass, ...validatedUser } = user;

    return validatedUser;
  }
}
