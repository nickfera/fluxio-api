import { Injectable } from "@nestjs/common";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserEntity } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { TUserVerificationType } from "../userVerification/userVerification.entity";

export type TValidatedUser = Pick<UserEntity, "id" | "firstName" | "role"> & {
  pendingUserVerifications?: TUserVerificationType[];
};

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
      .findOneBy(isPhoneNumber ? "phoneNumber" : "email", emailOrPhoneNumber, {
        userVerifications: true,
      })
      .catch(() => undefined);

    if (!user || !(await this.scryptService.verify(password, user.password))) {
      return null;
    }

    let pendingUserVerifications: TUserVerificationType[] | undefined =
      undefined;

    if (
      user.userVerifications &&
      user.userVerifications.length > 0 &&
      user.userVerifications.every(
        (verification) => !verification.isVerified,
      ) &&
      !user.lastLoginAt
    ) {
      pendingUserVerifications = user.userVerifications.map(
        ({ verificationType }) => verificationType,
      );
    }

    return {
      id: user.id,
      firstName: user.firstName,
      role: user.role,
      pendingUserVerifications,
    };
  }
}
