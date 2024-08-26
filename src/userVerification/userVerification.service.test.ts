import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { faker } from "@faker-js/faker";
import { UserVerificationService } from "./userVerification.service";
import {
  TUserVerificationType,
  UserVerificationEntity,
} from "./userVerification.entity";
import { UserVerificationRepository } from "./userVerification.repository";
import { MessageService } from "src/message/message.service";
import { UserEntity } from "src/user/user.entity";

const dummyToken = "123456";
const dummyTokenHash =
  "1327353f0203b13f1f3b819dabb16a612c791aae694b7a3943a682def10282db";

const dummyUser: UserEntity = {
  id: faker.number.int(),
  createdAt: new Date(Date.now()).toISOString(),
  updatedAt: null,
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  password:
    "c8580c9544eb0291c2f8c43996ae1015:0bd3100e141296d97132c7de80f252a68a6661936da93fc6634e473d25134f2f96feb8c5d69de4b7b2ed126469c9031d65332fc8f6d89283401c2d7235ac093b",
  email: faker.internet.email(),
  phoneNumber: faker.string.numeric(11),
  role: "owner",
};

const dummyUserVerification: UserVerificationEntity = {
  id: faker.number.int(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: null,
  userId: dummyUser.id,
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

const mockMessageService = {
  sendEmail: mock.fn((): void => {}),
  sendSMS: mock.fn((): void => {}),
};

describe("UserVerificationService", undefined, () => {
  let userVerificationService: UserVerificationService;

  beforeEach(async () => {
    mockUserVerificationRepository.findOne.mock.resetCalls();
    mockUserVerificationRepository.save.mock.resetCalls();
    mockMessageService.sendEmail.mock.resetCalls();
    mockMessageService.sendSMS.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        UserVerificationService,
        {
          provide: UserVerificationRepository,
          useValue: mockUserVerificationRepository,
        },
        {
          provide: MessageService,
          useValue: mockMessageService,
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
    const email = faker.internet.email();

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

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        userId,
        verificationType,
        tokenHash: dummyTokenHash,
        expiresAt: expectedUserVerificiation.expiresAt,
        isVerified: false,
      },
    ];

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
        await userVerificationService.create(userId, verificationType, email),
      "Should not reject or throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
    assert.strictEqual(
      mockMessageService.sendEmail.mock.callCount(),
      1,
      "MessageService 'sendEmail' should be called 1 time",
    );
  });

  it("Should create user phone number verification and token", async (context) => {
    const userId = faker.number.int();
    const verificationType: TUserVerificationType = "phone";
    const phoneNumber = faker.string.numeric(11);

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

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        userId,
        verificationType,
        tokenHash: dummyTokenHash,
        expiresAt: expectedUserVerificiation.expiresAt,
        isVerified: false,
      },
    ];

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
        await userVerificationService.create(
          userId,
          verificationType,
          phoneNumber,
        ),
      "Should not reject or throw exception",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
    assert.strictEqual(
      mockMessageService.sendSMS.mock.callCount(),
      1,
      "MessageService 'sendSMS' should be called 1 time",
    );
  });

  it("Should verify e-mail with token and user id", async (context) => {
    const token = dummyToken;
    const userId = dummyUserVerification.userId;
    const email = faker.internet.email();
    const verificationType: TUserVerificationType = "email";
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        userId,
        isVerified: false,
      },
      { user: true },
    ];

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        ...dummyUserVerification,
        verificationType,
        expiresAt,
        tokenHash: null,
        isVerified: true,
      },
    ];

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
        user: { ...dummyUser, email },
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
    assert.strictEqual(
      mockMessageService.sendEmail.mock.callCount(),
      1,
      "MessageService 'sendEmail' should be called 1 time",
    );
  });

  it("Should verify phone number with token and user id", async (context) => {
    const token = dummyToken;
    const userId = dummyUserVerification.userId;
    const phoneNumber = faker.string.numeric(11);
    const verificationType: TUserVerificationType = "phone";
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        userId,
        isVerified: false,
      },
      { user: true },
    ];

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        ...dummyUserVerification,
        verificationType,
        expiresAt,
        tokenHash: null,
        isVerified: true,
      },
    ];

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
        user: { ...dummyUser, phoneNumber },
      }),
    );

    mockUserVerificationRepository.save.mock.mockImplementationOnce(
      async (): Promise<UserVerificationEntity> => ({
        ...dummyUserVerification,
        verificationType,
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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
    assert.strictEqual(
      mockMessageService.sendSMS.mock.callCount(),
      1,
      "MessageService 'sendSMS' should be called 1 time",
    );
  });

  it("Should verify token with e-mail", async (context) => {
    const token = dummyToken;
    const email = faker.internet.email();
    const verificationType: TUserVerificationType = "email";
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        isVerified: false,
        user: { email },
      },
      { user: true },
    ];

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        ...dummyUserVerification,
        verificationType,
        tokenHash: null,
        expiresAt,
        isVerified: true,
      },
    ];

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
        user: { ...dummyUser, email },
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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
    assert.strictEqual(
      mockMessageService.sendEmail.mock.callCount(),
      1,
      "MessageService 'sendEmail' should be called 1 time",
    );
  });

  it("Should verify with phone number", async (context) => {
    const token = dummyToken;
    const phoneNumber = faker.phone.number();
    const verificationType: TUserVerificationType = "phone";
    const isVerified = false;
    const expiresAt = new Date(100000).toISOString();

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        isVerified: false,
        user: { phoneNumber },
      },
      { user: true },
    ];

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        ...dummyUserVerification,
        verificationType,
        tokenHash: null,
        expiresAt,
        isVerified: true,
      },
    ];

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
        user: { ...dummyUser, phoneNumber },
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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
    assert.strictEqual(
      mockMessageService.sendSMS.mock.callCount(),
      1,
      "MessageService 'sendSMS' should be called 1 time",
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

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash,
        isVerified: false,
        userId,
      },
      { user: true },
    ];

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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
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

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        isVerified: false,
        user: { email },
      },
      { user: true },
    ];

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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
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

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        isVerified: false,
        user: { phoneNumber },
      },
      { user: true },
    ];

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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
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

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        tokenHash: dummyTokenHash,
        isVerified: false,
        userId,
      },
      { user: true },
    ];

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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
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

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        isVerified: false,
        user: { email },
      },
    ];

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        ...dummyUserVerification,
        tokenHash: dummyTokenHash,
        verificationType,
        isVerified,
        expiresAt,
      },
    ];

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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });

  it("Should generate new token for user phone number verification", async (context) => {
    const phoneNumber = faker.phone.number();
    const verificationType: TUserVerificationType = "phone";
    const isVerified = false;
    const expiresAt = new Date(30 * 60 * 1000).toISOString();

    const expectedFindOneArgs: Parameters<
      UserVerificationRepository["findOne"]
    > = [
      {
        isVerified: false,
        user: { phoneNumber },
      },
    ];

    const expectedSaveArgs: Parameters<UserVerificationRepository["save"]> = [
      {
        ...dummyUserVerification,
        tokenHash: dummyTokenHash,
        verificationType,
        isVerified,
        expiresAt,
      },
    ];

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
      mockUserVerificationRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "UserVerificationRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserVerificationRepository.save.mock.callCount(),
      1,
      "UserVerificationRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserVerificationRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "UserVerificationRepository 'save' called with unexpected arguments",
    );
  });
});
