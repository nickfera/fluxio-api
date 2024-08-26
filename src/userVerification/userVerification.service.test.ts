import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { UserVerificationService } from "./userVerification.service";
import {
  TUserVerificationType,
  UserVerificationEntity,
} from "./userVerification.entity";
import { UserVerificationRepository } from "./userVerification.repository";
import { DeepPartial, FindOptionsWhere } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";

const dummyToken = "123456";
const dummyTokenHash =
  "1327353f0203b13f1f3b819dabb16a612c791aae694b7a3943a682def10282db";

const dummyUserVerification: UserVerificationEntity = {
  id: faker.number.int(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: null,
  userId: faker.number.int(),
  verificationType: "email",
  tokenHash: dummyTokenHash,
  expiresAt: faker.date.recent().toISOString(),
  isVerified: true,
};

const mockUserVerificationRepository = {
  findOne: mock.fn(
    async (): Promise<UserVerificationEntity | null> => dummyUserVerification,
  ),
  save: mock.fn(
    async (): Promise<UserVerificationEntity> => dummyUserVerification,
  ),
};

describe("UserVerificationService", undefined, () => {
  let userVerificationService: UserVerificationService;

  beforeEach(async () => {
    mockUserVerificationRepository.findOne.mock.resetCalls();
    mockUserVerificationRepository.save.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        UserVerificationService,
        {
          provide: UserVerificationRepository,
          useValue: mockUserVerificationRepository,
        },
      ],
    }).compile();

    userVerificationService = moduleRef.get<UserVerificationService>(
      UserVerificationService,
    );
  });

  it("should generate token", () => {
    const token = userVerificationService.generateToken();

    assert.strictEqual(typeof token, "string", "'token' must be a string");
    assert.strictEqual(token.length, 6, "'token' must be 6 characters long");
  });

  it("Should generate token hash", async () => {
    const token = "123456";

    const tokenHash = userVerificationService.generateTokenHash(token);

    assert.strictEqual(
      typeof tokenHash,
      "string",
      "'tokenHash' must be a string",
    );
    assert.strictEqual(
      tokenHash.length,
      64,
      "'tokenHash' must be 64 characters long",
    );
  });

  it("Should create user email verification and token", async (context) => {
    const userId = faker.number.int();
    const verificationType: TUserVerificationType = "email";

    const expectedUserVerificiation: UserVerificationEntity = {
      id: faker.number.int(),
      createdAt: new Date(0).toISOString(),
      updatedAt: null,
      userId,
      verificationType,
      tokenHash: dummyTokenHash,
      expiresAt: new Date(30 * 60 * 1000).toISOString(),
      isVerified: false,
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      userId,
      verificationType,
      tokenHash: dummyTokenHash,
      expiresAt: expectedUserVerificiation.expiresAt,
      isVerified: false,
    };

    context.mock.method(
      userVerificationService,
      "generateToken",
      () => dummyToken,
      { times: 1 },
    );

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async () => expectedUserVerificiation,
    );

    await assert.doesNotReject(
      async () =>
        await userVerificationService.create(userId, verificationType),
      "Should not reject or throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should create user phone number verification and token", async (context) => {
    const userId = faker.number.int();
    const verificationType: TUserVerificationType = "phone";

    const expectedUserVerificiation: UserVerificationEntity = {
      id: faker.number.int(),
      createdAt: new Date(0).toISOString(),
      updatedAt: null,
      userId,
      verificationType,
      tokenHash: dummyTokenHash,
      expiresAt: new Date(30 * 60 * 1000).toISOString(),
      isVerified: false,
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      userId,
      verificationType,
      tokenHash: dummyTokenHash,
      expiresAt: expectedUserVerificiation.expiresAt,
      isVerified: false,
    };

    context.mock.method(
      userVerificationService,
      "generateToken",
      () => dummyToken,
      { times: 1 },
    );

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async () => expectedUserVerificiation,
    );

    await assert.doesNotReject(
      async () =>
        await userVerificationService.create(userId, verificationType),
      "Should not reject or throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should verify token with user id", async (context) => {
    const token = dummyToken;
    const userId = dummyUserVerification.userId;
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash: dummyTokenHash,
      userId,
      isVerified: false,
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      ...dummyUserVerification,
      expiresAt,
      tokenHash: null,
      isVerified: true,
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        isVerified,
        expiresAt,
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        expiresAt,
        isVerified: true,
      }),
    );

    await assert.doesNotReject(
      async () => await userVerificationService.verify(token, { userId }),
      "Should not or reject throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should verify token with e-mail", async (context) => {
    const token = dummyToken;
    const email = faker.internet.email();
    const verificationType: TUserVerificationType = "email";
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash: dummyTokenHash,
      isVerified: false,
      user: { email },
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      ...dummyUserVerification,
      verificationType,
      tokenHash: null,
      expiresAt,
      isVerified: true,
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        isVerified,
        expiresAt,
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        isVerified: true,
        expiresAt,
      }),
    );

    await assert.doesNotReject(
      async () => await userVerificationService.verify(token, { email }),
      "Should not reject or throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should verify with phone number", async (context) => {
    const token = dummyToken;
    const phoneNumber = faker.phone.number();
    const verificationType: TUserVerificationType = "phone";
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash: dummyTokenHash,
      isVerified: false,
      user: { phoneNumber },
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      ...dummyUserVerification,
      verificationType,
      tokenHash: null,
      expiresAt,
      isVerified: true,
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        isVerified,
        expiresAt,
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        isVerified: true,
      }),
    );

    await assert.doesNotReject(
      async () => await userVerificationService.verify(token, { phoneNumber }),
      "Should not reject or throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should not verify because no user id, e-mail or phone number was informed", async () => {
    const token = dummyToken;

    await assert.rejects(
      async () => await userVerificationService.verify(token, {}),
      BadRequestException,
      "Should throw 'BadRequestException'",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      0,
      "UserVerificationRepository 'findOne' should not be called",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      0,
      "UserVerificationRepository 'save' should not be called",
    );
  });

  it("Should not verify because both e-mail and phone number were informed", async () => {
    const token = dummyToken;
    const email = faker.internet.email();
    const phoneNumber = faker.phone.number();

    await assert.rejects(
      async () =>
        await userVerificationService.verify(token, { email, phoneNumber }),
      BadRequestException,
      "Should throw 'BadRequestException'",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      0,
      "UserVerificationRepository 'findOne' should not be called",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      0,
      "UserVerificationRepository 'save' should not be called",
    );
  });

  it("Should not verify because of incorrect token", async (context) => {
    const token = "654321";
    const userId = dummyUserVerification.userId;

    const tokenHash =
      "481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5";

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash,
      isVerified: false,
      userId,
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => tokenHash,
      { times: 1 },
    );

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async () => null,
    );

    await assert.rejects(
      async () => await userVerificationService.verify(token, { userId }),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      0,
      "UserVerificationRepository 'save' should not be called",
    );
  });

  it("Should not verify because of incorrect e-mail", async (context) => {
    const token = dummyToken;
    const email = faker.internet.email();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash: dummyTokenHash,
      isVerified: false,
      user: { email },
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async () => null,
    );

    await assert.rejects(
      async () => await userVerificationService.verify(token, { email }),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      0,
      "UserVerificationRepository 'save' should not be called",
    );
  });

  it("Should not verify because of incorrect phone number", async (context) => {
    const token = dummyToken;
    const phoneNumber = faker.phone.number();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash: dummyTokenHash,
      isVerified: false,
      user: { phoneNumber },
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async () => null,
    );

    await assert.rejects(
      async () => await userVerificationService.verify(token, { phoneNumber }),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      0,
      "UserVerificationRepository 'save' should not be called",
    );
  });

  it("Should not verify because of expired token", async (context) => {
    const token = dummyToken;
    const userId = dummyUserVerification.userId;
    const isVerified = false;
    const expiresAt = new Date(0).toISOString();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      tokenHash: dummyTokenHash,
      isVerified: false,
      userId,
    };

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 100000 });

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async () => ({
        ...dummyUserVerification,
        isVerified,
        expiresAt,
      }),
    );

    await assert.rejects(
      async () => await userVerificationService.verify(token, { userId }),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      0,
      "UserVerificationRepository 'save' should not be called",
    );
  });

  it("Should generate new token for user e-mail verification", async (context) => {
    const email = faker.internet.email();
    const verificationType: TUserVerificationType = "email";
    const isVerified = false;
    const expiresAt = new Date(30 * 60 * 1000).toISOString();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      isVerified: false,
      user: { email },
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      ...dummyUserVerification,
      tokenHash: dummyTokenHash,
      verificationType,
      isVerified,
      expiresAt,
    };

    context.mock.method(
      userVerificationService,
      "generateToken",
      () => dummyToken,
      { times: 1 },
    );

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        isVerified,
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        tokenHash: dummyTokenHash,
        isVerified,
        expiresAt,
      }),
    );

    await assert.doesNotReject(
      async () => await userVerificationService.regenerate({ email }),
      "Should not or reject throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should generate new token for user phone number verification", async (context) => {
    const phoneNumber = faker.phone.number();
    const verificationType: TUserVerificationType = "phone";
    const isVerified = false;
    const expiresAt = new Date(30 * 60 * 1000).toISOString();

    const expectedFindOneArg: FindOptionsWhere<UserVerificationEntity> = {
      isVerified: false,
      user: { phoneNumber },
    };

    const expectedSaveArg: DeepPartial<UserVerificationEntity> = {
      ...dummyUserVerification,
      tokenHash: dummyTokenHash,
      verificationType,
      isVerified,
      expiresAt,
    };

    context.mock.method(
      userVerificationService,
      "generateToken",
      () => dummyToken,
      { times: 1 },
    );

    context.mock.method(
      userVerificationService,
      "generateTokenHash",
      () => dummyTokenHash,
      { times: 1 },
    );

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserVerificationRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        isVerified,
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
        tokenHash: dummyTokenHash,
        isVerified,
        expiresAt,
      }),
    );

    await assert.doesNotReject(
      async () => await userVerificationService.regenerate({ phoneNumber }),
      "Should not or reject throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.findOne.mock.callCount(),
      1,
      "UserVerificationRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.findOne.mock.calls[0].arguments.at(0),
      expectedFindOneArg,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments.at(0),
      expectedSaveArg,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });
});
