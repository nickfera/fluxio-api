import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { DeepPartial, FindOptionsWhere, Not } from "typeorm";
import { faker } from "@faker-js/faker";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { TCreateUserPublicSchema } from "./schema/createUser.schema";
import { UserEntity } from "./user.entity";
import { ScryptService } from "../scrypt/scrypt.service";
import {
  TUpdateAuthenticatedUserSchema,
  TUpdateUserSchema,
} from "./schema/updateUser.schema";
import { BadRequestValidationException } from "../common/error/badRequestValidation.exception";
import { UserVerificationService } from "../userVerification/userVerification.service";

const dummyPassword = "12345678";
const dummyPasswordHash =
  "c8580c9544eb0291c2f8c43996ae1015:0bd3100e141296d97132c7de80f252a68a6661936da93fc6634e473d25134f2f96feb8c5d69de4b7b2ed126469c9031d65332fc8f6d89283401c2d7235ac093b";

const dummyUser: UserEntity = {
  id: faker.number.int(),
  createdAt: new Date(Date.now()).toISOString(),
  updatedAt: null,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  password: dummyPasswordHash,
  // password:
  //   "4decffaa441b8889e4c61a67736c31e5:2d15367d55a3748e76f71a2825caff96010d3b87f3cbf2952c17ac442f5f67d030abe383eb99cabc98fd1120fb5e3ea10c006bd6d65f613b97c641e7625062c7",
  email: faker.internet.email(),
  phoneNumber: faker.string.numeric(11),
  role: "owner",
};

const mockUserRepository = {
  findOne: mock.fn(async (): Promise<UserEntity | null> => dummyUser),
  save: mock.fn(async (entity: UserEntity): Promise<UserEntity> => entity),
};

const mockScryptService = {
  hash: mock.fn(async (): Promise<string> => dummyPasswordHash),
  verify: mock.fn(async (): Promise<boolean> => true),
};

const mockUserConfirmationService = {
  create: mock.fn(async (): Promise<any> => {}),
};

describe("UserService", undefined, () => {
  let userService: UserService;

  beforeEach(async () => {
    mockUserRepository.findOne.mock.resetCalls();
    mockUserRepository.save.mock.resetCalls();
    mockScryptService.hash.mock.resetCalls();
    mockScryptService.verify.mock.resetCalls();
    mockUserConfirmationService.create.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ScryptService,
          useValue: mockScryptService,
        },
        {
          provide: UserVerificationService,
          useValue: mockUserConfirmationService,
        },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
  });

  describe("Create user", undefined, () => {
    it("Should create user", async () => {
      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: dummyPassword,
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
      };

      const expectedUser: UserEntity = {
        id: faker.number.int(),
        createdAt: new Date(Date.now()).toISOString(),
        updatedAt: null,
        firstName: createUser.firstName,
        lastName: createUser.lastName,
        email: createUser.email,
        phoneNumber: createUser.phoneNumber,
        password: dummyPasswordHash,
        role: "owner",
      };

      const expectedUserRepositoryFindOneArg: FindOptionsWhere<UserEntity>[] = [
        { email: createUser.email },
        { phoneNumber: createUser.phoneNumber },
      ];

      const expectedUserRepositorySaveArg: DeepPartial<UserEntity> = {
        firstName: createUser.firstName,
        lastName: createUser.lastName,
        email: createUser.email,
        phoneNumber: createUser.phoneNumber,
        password: dummyPasswordHash,
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      mockScryptService.hash.mock.mockImplementationOnce(
        async () => dummyPasswordHash,
      );

      mockUserRepository.save.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => expectedUser,
      );

      const user = await userService.create(createUser);

      assert.strictEqual(typeof user, "object", "'user' should be defined");
      assert.deepStrictEqual(
        user,
        expectedUser,
        "'user' was not created as expeced",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called once",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedUserRepositoryFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
      assert.strictEqual(
        mockUserRepository.save.mock.callCount(),
        1,
        "UserRepository 'save' should be called once",
      );
      assert.deepStrictEqual(
        mockUserRepository.save.mock.calls[0].arguments.at(0),
        expectedUserRepositorySaveArg,
        "UserRepository 'save' called with unexpected arguments",
      );
      assert.strictEqual(
        mockUserConfirmationService.create.mock.callCount(),
        2,
        "UserVerificationService 'create' should be called 2 times",
      );
    });

    it("Should not create user, no e-mail or phone number informed", async () => {
      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
      };

      await assert.rejects(
        async () => await userService.create(createUser),
        BadRequestException,
        "Should throw 'BadRequestException'",
      );
    });

    it("Should not create user, e-mail already being used", async () => {
      const email = faker.internet.email();

      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email,
      };

      const userWithEmail: UserEntity = {
        id: faker.number.int(),
        createdAt: new Date(Date.now()).toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email,
        phoneNumber: faker.string.numeric(11),
        password: dummyPasswordHash,
        role: "owner",
      };

      const expectedUserRepositoryFindOneArg: FindOptionsWhere<UserEntity>[] = [
        { email },
      ];

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => userWithEmail,
      );

      await assert.rejects(
        async () => await userService.create(createUser),
        BadRequestException,
        "Should throw 'BadRequestException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedUserRepositoryFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should not create user, phone number already being used", async () => {
      const phoneNumber = faker.string.numeric(11);

      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        phoneNumber,
      };

      const userWithPhoneNumber: UserEntity = {
        id: faker.number.int(),
        createdAt: new Date(Date.now()).toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: dummyPasswordHash,
        email: faker.internet.email(),
        phoneNumber,
        role: "owner",
      };

      const expectedUserRepositoryFindOneArg: FindOptionsWhere<UserEntity>[] = [
        { phoneNumber },
      ];

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => userWithPhoneNumber,
      );

      await assert.rejects(
        async () => await userService.create(createUser),
        BadRequestException,
        "Should throw 'BadRequestException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedUserRepositoryFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });
  });

  describe("Find one user", undefined, () => {
    it("Should find user by id", async () => {
      const id = dummyUser.id;

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        id,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => dummyUser,
      );

      const user = await userService.findOneBy("id", id);

      assert.deepStrictEqual(
        user,
        dummyUser,
        "User found is different than expected",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should not find user by id", async () => {
      const id = faker.number.int();

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        id,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => await userService.findOneBy("id", id),
        NotFoundException,
        "Should throw 'NotFoundException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should find user by e-mail", async () => {
      const email = faker.internet.email();

      const expectedUser: UserEntity = { ...dummyUser, email };

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        email,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => expectedUser,
      );

      const user = await userService.findOneBy("email", email);

      assert.deepStrictEqual(
        user,
        expectedUser,
        "User found is different than expected",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should not find user by e-mail", async () => {
      const email = faker.internet.email();

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        email,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => await userService.findOneBy("email", email),
        NotFoundException,
        "Should throw 'NotFoundException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should find user by phone number", async () => {
      const phoneNumber = faker.string.numeric(11);

      const expectedUser: UserEntity = {
        ...dummyUser,
        phoneNumber,
      };

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        phoneNumber,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => expectedUser,
      );

      const user = await userService.findOneBy("phoneNumber", phoneNumber);

      assert.deepStrictEqual(
        user,
        expectedUser,
        "User found is different than expected",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should not find user by phone number", async () => {
      const phoneNumber = faker.string.numeric(11);

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        phoneNumber,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => await userService.findOneBy("phoneNumber", phoneNumber),
        NotFoundException,
        "Should throw 'NotFoundException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });
  });

  describe("Update user", undefined, () => {
    it("Should update user", async () => {
      const email = faker.internet.email();
      const phoneNumber = faker.string.numeric(11);

      const updateUser: TUpdateUserSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email,
        phoneNumber,
      };

      const expectedUpdatedUser: UserEntity = {
        ...dummyUser,
        updatedAt: new Date(Date.now()).toISOString(),
        ...updateUser,
      };

      const expectedFindOneArgCall0: FindOptionsWhere<UserEntity> = {
        id: dummyUser.id,
      };

      const expectedFindOneArgCall1: FindOptionsWhere<UserEntity>[] = [
        { email, id: Not(dummyUser.id) },
        { phoneNumber, id: Not(dummyUser.id) },
      ];

      const expectedSaveArg: DeepPartial<UserEntity> = {
        ...dummyUser,
        ...updateUser,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => dummyUser,
        0,
      );

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => null,
        1,
      );

      mockUserRepository.save.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => expectedUpdatedUser,
      );

      const updatedUser = await userService.update(dummyUser.id, updateUser);

      assert.deepStrictEqual(
        updatedUser,
        expectedUpdatedUser,
        "User updated is different than expected",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        2,
        "UserRepository 'findOne' should be called 2 times",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArgCall0,
        "UserRepository 'findOne' called with unexpected arguments in call 0",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[1].arguments.at(0),
        expectedFindOneArgCall1,
        "UserRepository 'findOne' called with unexpected arguments in call 1",
      );
      assert.strictEqual(
        mockUserRepository.save.mock.callCount(),
        1,
        "UserRepository 'save' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.save.mock.calls[0].arguments.at(0),
        expectedSaveArg,
        "UserRepository 'save' called with unexpected arguments",
      );
      assert.strictEqual(
        mockUserConfirmationService.create.mock.callCount(),
        2,
        "UserVerificationService 'create' should be called 2 times",
      );
    });

    it("Should not update user because entity was not found", async () => {
      const id = faker.number.int();

      const updateUser: TUpdateUserSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
      };

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        id,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => userService.update(id, updateUser),
        NotFoundException,
        "Should throw 'NotFoundException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should not update user because e-mail is being used", async () => {
      const id = faker.number.int();
      const email = faker.internet.email();

      const updateUser: TUpdateUserSchema = {
        email,
      };

      const user: UserEntity = {
        id,
        createdAt: new Date(Date.now()).toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: dummyPasswordHash,
        email: faker.internet.email(),
        role: "owner",
      };

      const expectedFindOneArgCall0: FindOptionsWhere<UserEntity> = { id };

      const expectedFindOneArgCall1: FindOptionsWhere<UserEntity>[] = [
        { email, id: Not(id) },
      ];

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => user,
        0,
      );

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => ({ ...dummyUser, email }),
        1,
      );

      await assert.rejects(
        async () => userService.update(id, updateUser),
        BadRequestValidationException,
        "Should throw 'BadRequestValidationException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        2,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArgCall0,
        "UserRepository 'findOne' called with unexpected arguments",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[1].arguments.at(0),
        expectedFindOneArgCall1,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should not update user because phone number is being used", async () => {
      const id = faker.number.int();
      const phoneNumber = faker.string.numeric(11);

      const updateUser: TUpdateUserSchema = {
        phoneNumber,
      };

      const user: UserEntity = {
        id,
        createdAt: new Date(Date.now()).toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: dummyPasswordHash,
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      const expectedFindOneArgCall0: FindOptionsWhere<UserEntity> = { id };

      const expectedFindOneArgCall1: FindOptionsWhere<UserEntity>[] = [
        { phoneNumber, id: Not(id) },
      ];

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => user,
        0,
      );

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async (): Promise<UserEntity> => ({ ...dummyUser, phoneNumber }),
        1,
      );

      await assert.rejects(
        async () => userService.update(id, updateUser),
        BadRequestValidationException,
        "Should throw 'BadRequestValidationException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        2,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArgCall0,
        "UserRepository 'findOne' called with unexpected arguments",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[1].arguments.at(0),
        expectedFindOneArgCall1,
        "UserRepository 'findOne' called with unexpected arguments",
      );
    });

    it("Should update user password", async () => {
      const password = dummyPassword;
      const passwordHash = dummyPasswordHash;

      const newPassword = faker.internet.password();
      const newPasswordHash =
        "4decffaa441b8889e4c61a67736c31e5:2d15367d55a3748e76f71a2825caff96010d3b87f3cbf2952c17ac442f5f67d030abe383eb99cabc98fd1120fb5e3ea10c006bd6d65f613b97c641e7625062c7";

      const updateUser: TUpdateAuthenticatedUserSchema = {
        password,
        newPassword,
      };

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: new Date(Date.now()).toISOString(),
        updatedAt: null,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: passwordHash,
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      const expectedUser: UserEntity = {
        ...user,
        password: newPasswordHash,
        updatedAt: new Date(Date.now()).toISOString(),
      };

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        id: user.id,
      };

      const expectedSaveArg: DeepPartial<UserEntity> = {
        ...user,
        password: newPasswordHash,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => user);

      mockScryptService.verify.mock.mockImplementationOnce(async () => true);

      mockScryptService.hash.mock.mockImplementationOnce(
        async () => newPasswordHash,
      );

      mockUserRepository.save.mock.mockImplementationOnce(
        async () => expectedUser,
      );

      const updatedUser = await userService.update(user.id, updateUser);

      assert.strictEqual(
        typeof updatedUser,
        "object",
        "Updated user should be defined",
      );
      assert.deepStrictEqual(
        updatedUser,
        expectedUser,
        "User updated not as expected",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
      assert.strictEqual(
        mockScryptService.verify.mock.callCount(),
        1,
        "ScryptService 'verify' should be called 1 time",
      );
      assert.strictEqual(
        mockScryptService.hash.mock.callCount(),
        1,
        "ScryptService 'verify' should be called 1 time",
      );
      assert.strictEqual(
        mockUserRepository.save.mock.callCount(),
        1,
        "UserRepository 'save' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.save.mock.calls[0].arguments.at(0),
        expectedSaveArg,
        "UserRepository 'save' called with unexpected arguments",
      );
    });

    it("Should not update user password because old password is incorrect", async () => {
      const updateUser: TUpdateAuthenticatedUserSchema = {
        password: faker.internet.password(),
        newPassword: faker.internet.password(),
      };

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: dummyPasswordHash,
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      const expectedFindOneArg: FindOptionsWhere<UserEntity> = {
        id: user.id,
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => user);

      mockScryptService.verify.mock.mockImplementationOnce(async () => false);

      await assert.rejects(
        async () => await userService.update(user.id, updateUser),
        UnauthorizedException,
        "Should throw 'UnauthorizedException'",
      );
      assert.strictEqual(
        mockUserRepository.findOne.mock.callCount(),
        1,
        "UserRepository 'findOne' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserRepository.findOne.mock.calls[0].arguments.at(0),
        expectedFindOneArg,
        "UserRepository 'findOne' called with unexpected arguments",
      );
      assert.strictEqual(
        mockScryptService.verify.mock.callCount(),
        1,
        "ScryptService 'verify' should be called 1 time",
      );
    });
  });
});
