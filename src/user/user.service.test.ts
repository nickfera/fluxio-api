import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
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
import { UserVerificationService } from "src/userVerification/userVerification.service";

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
  save: mock.fn(async (entity: UserEntity): Promise<UserEntity> => entity),
};

const mockUserConfirmationService = {
  create: mock.fn(async (): Promise<any> => {}),
};

describe("UserService", undefined, () => {
  let userService: UserService;
  let scryptService: ScryptService;

  beforeEach(async () => {
    mockUserRepository.findOne.mock.resetCalls();
    mockUserRepository.save.mock.resetCalls();
    mockUserConfirmationService.create.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        UserService,
        ScryptService,
        {
          provide: UserVerificationService,
          useValue: mockUserConfirmationService,
        },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    scryptService = moduleRef.get<ScryptService>(ScryptService);
  });

  describe("Create user", undefined, () => {
    it("Should create user", async () => {
      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      const user = await userService.create(createUser);

      assert.strictEqual(typeof user, "object", "user should be defined");
      assert.strictEqual(
        mockUserConfirmationService.create.mock.callCount(),
        2,
        "'UserVerificationService.create' should be called 2 times",
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
        "should throw BadRequestException",
      );
    });

    it("Should not create user, e-mail already being used", async () => {
      const email = faker.internet.email();

      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email,
        phoneNumber: faker.string.numeric(11),
      };

      const userWithEmail: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email,
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => userWithEmail,
      );

      await assert.rejects(
        async () => await userService.create(createUser),
        BadRequestException,
        "should throw BadRequestException",
      );
    });

    it("Should not create user, phone number already being used", async () => {
      const phoneNumber = faker.string.numeric(11);

      const createUser: TCreateUserPublicSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber,
      };

      const userWithPhoneNumber: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber,
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => userWithPhoneNumber,
      );

      await assert.rejects(
        async () => await userService.create(createUser),
        BadRequestException,
        "should throw BadRequestException",
      );
    });
  });

  describe("Find one user", undefined, () => {
    it("Should find user by id", async () => {
      const id = dummyUser.id;

      const user = await userService.findOneBy("id", id);

      assert.strictEqual(typeof user, "object", "user should be defined");
    });

    it("Should not find user by id", async () => {
      const id = faker.number.int();

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => await userService.findOneBy("id", id),
        NotFoundException,
        "should throw NotFoundException",
      );
    });

    it("Should find user by e-mail", async () => {
      const email = faker.internet.email();

      const user = await userService.findOneBy("email", email);

      assert.strictEqual(typeof user, "object", "user should be defined");
    });

    it("Should not find user by e-mail", async () => {
      const email = faker.internet.email();

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => await userService.findOneBy("email", email),
        NotFoundException,
        "should throw NotFoundException",
      );
    });

    it("Should find user by phone number", async () => {
      const phoneNumber = faker.phone.number();

      const user = await userService.findOneBy("phoneNumber", phoneNumber);

      assert.strictEqual(typeof user, "object", "user should be defined");
    });

    it("Should not find user by phone number", async () => {
      const phoneNumber = faker.phone.number();

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => await userService.findOneBy("phoneNumber", phoneNumber),
        NotFoundException,
        "should throw NotFoundException",
      );
    });
  });

  describe("Update user", undefined, () => {
    it("Should update user", async () => {
      const updateUser: TUpdateUserSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
      };

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      const expectedUpdatedUser: UserEntity = { ...user, ...updateUser };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => user,
        0,
      );
      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => null,
        1,
      );

      const updatedUser = await userService.update(user.id, updateUser);

      assert.deepEqual(
        updatedUser,
        expectedUpdatedUser,
        "user should have updated properties",
      );
      assert.strictEqual(
        mockUserConfirmationService.create.mock.callCount(),
        2,
        "'UserVerificationService.create' should be called 2 times",
      );
    });

    it("Should not update user because it doesn't exist", async () => {
      const updateUser: TUpdateUserSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => userService.update(faker.number.int(), updateUser),
        NotFoundException,
        "should throw NotFoundException",
      );
    });

    it("Should not update user because e-mail is being used", async () => {
      const email = faker.internet.email();

      const updateUser: TUpdateUserSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email,
        phoneNumber: faker.string.numeric(11),
      };

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email,
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => user);

      await assert.rejects(
        async () => userService.update(faker.number.int(), updateUser),
        BadRequestValidationException,
        "should throw BadRequestValidationException",
      );
    });

    it("Should not update user because phone number is being used", async () => {
      const phoneNumber = faker.string.numeric(11);

      const updateUser: TUpdateUserSchema = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber,
      };

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password(),
        email: faker.internet.email(),
        phoneNumber,
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(async () => user);

      await assert.rejects(
        async () => userService.update(faker.number.int(), updateUser),
        BadRequestValidationException,
        "should throw BadRequestValidationException",
      );
    });

    it("Should update user password", async () => {
      const password = faker.internet.password();
      const hashedPassword = await scryptService.hash(password);

      const updateUser: TUpdateAuthenticatedUserSchema = {
        password,
        newPassword: faker.internet.password(),
      };

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: hashedPassword,
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => user,
        0,
      );
      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => null,
        1,
      );

      const updatedUser = await userService.update(user.id, updateUser);

      assert.notEqual(
        user.password,
        updatedUser.password,
        "password should be updated",
      );
    });

    it("Should not update user password because old password is incorrect", async () => {
      const updateUser: TUpdateAuthenticatedUserSchema = {
        password: faker.internet.password(),
        newPassword: faker.internet.password(),
      };

      const hashedPassword = await scryptService.hash(
        faker.internet.password(),
      );

      const user: UserEntity = {
        id: faker.number.int(),
        createdAt: faker.date.past().toISOString(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: hashedPassword,
        email: faker.internet.email(),
        phoneNumber: faker.string.numeric(11),
        role: "owner",
      };

      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => user,
        1,
      );
      mockUserRepository.findOne.mock.mockImplementationOnce(
        async () => null,
        2,
      );

      await assert.rejects(
        async () => await userService.update(user.id, updateUser),
        UnauthorizedException,
        "should throw UnauthorizedException",
      );
    });
  });
});
