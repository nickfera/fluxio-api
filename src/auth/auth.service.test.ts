import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { AuthService } from "./auth.service";
import { UserEntity } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserRepository } from "../user/user.repository";

const dummyUser: UserEntity = {
  id: faker.number.int(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: null,
  deletedAt: null,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  password:
    "4decffaa441b8889e4c61a67736c31e5:2d15367d55a3748e76f71a2825caff96010d3b87f3cbf2952c17ac442f5f67d030abe383eb99cabc98fd1120fb5e3ea10c006bd6d65f613b97c641e7625062c7",
  email: faker.internet.email(),
  phoneNumber: faker.string.numeric(11),
  role: "owner",
};

const mockUserRepository = {
  findOne: mock.fn(async (): Promise<UserEntity | null> => dummyUser),
};

const mockUserService = {
  findOneBy: mock.fn(async (): Promise<UserEntity | null> => dummyUser),
};

describe("AuthService", undefined, () => {
  let authService: AuthService;
  let userService: UserService;
  let scryptService: ScryptService;

  beforeEach(async () => {
    mockUserService.findOneBy.mock.resetCalls();
    mockUserRepository.findOne.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, ScryptService],
    })
      .useMocker((token) => {
        if (token === UserService) {
          return mockUserService;
        } else if (token === UserRepository) {
          return mockUserRepository;
        }
      })
      .compile();

    authService = moduleRef.get<AuthService>(AuthService);
    userService = moduleRef.get<UserService>(UserService);
    scryptService = moduleRef.get<ScryptService>(ScryptService);
  });

  it("should validate user by e-mail", undefined, async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    const hashedPassword = await scryptService.hash(password);

    const user = { ...dummyUser, email, password: hashedPassword };

    mockUserService.findOneBy.mock.mockImplementationOnce(async () => user);

    const validatedUser = await authService.validateUser(email, password);

    assert.notStrictEqual(validatedUser, { ...user, password: undefined });
  });

  it(
    "should not validate user by e-mail, user doesn't exist",
    undefined,
    async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      mockUserService.findOneBy.mock.mockImplementationOnce(async () => null);

      const validatedUser = await authService.validateUser(email, password);

      assert.strictEqual(validatedUser, null);
    },
  );

  it(
    "should not validate user by e-mail, incorrect password",
    undefined,
    async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      mockUserService.findOneBy.mock.mockImplementationOnce(
        async () => dummyUser,
      );

      const validatedUser = await authService.validateUser(email, password);

      assert.strictEqual(validatedUser, null);
    },
  );

  it("should validate user by phone number", undefined, async () => {
    const phoneNumber = faker.phone.number();
    const password = faker.internet.password();
    const hashedPassword = await scryptService.hash(password);

    const user = { ...dummyUser, phoneNumber, password: hashedPassword };

    mockUserService.findOneBy.mock.mockImplementationOnce(async () => user);

    const validatedUser = await authService.validateUser(phoneNumber, password);

    assert.notStrictEqual(validatedUser, { ...user, password: undefined });
  });

  it(
    "should not validate user by phone number, user doesn't exist",
    undefined,
    async () => {
      const phoneNumber = faker.phone.number();
      const password = faker.internet.password();

      mockUserService.findOneBy.mock.mockImplementationOnce(async () => null);

      const validatedUser = await authService.validateUser(
        phoneNumber,
        password,
      );

      assert.strictEqual(validatedUser, null);
    },
  );

  it(
    "should not validate user by phone number, incorrect password",
    undefined,
    async () => {
      const phoneNumber = faker.phone.number();
      const password = faker.internet.password();

      mockUserService.findOneBy.mock.mockImplementationOnce(
        async () => dummyUser,
      );

      const validatedUser = await authService.validateUser(
        phoneNumber,
        password,
      );

      assert.strictEqual(validatedUser, null);
    },
  );
});
