import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { AuthService, TValidatedUser } from "./auth.service";
import { UserEntity } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { ScryptService } from "../scrypt/scrypt.service";
import { UserRepository } from "../user/user.repository";

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
  email: faker.internet.email(),
  phoneNumber: faker.string.numeric(11),
  role: "owner",
};

const mockUserRepository = {
  findOne: mock.fn(async (): Promise<UserEntity | null> => dummyUser),
};

const mockUserService = {
  findOneBy: mock.fn(async (): Promise<UserEntity | null> => dummyUser),
  update: mock.fn(async (): Promise<UserEntity> => dummyUser),
};

const mockScryptService = {
  hash: mock.fn(async (): Promise<string> => dummyPasswordHash),
  verify: mock.fn(async (): Promise<boolean> => true),
};

describe("AuthService", undefined, () => {
  let authService: AuthService;

  beforeEach(async () => {
    mockUserRepository.findOne.mock.resetCalls();
    mockUserService.findOneBy.mock.resetCalls();
    mockUserService.update.mock.resetCalls();
    mockScryptService.hash.mock.resetCalls();
    mockScryptService.verify.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ScryptService,
          useValue: mockScryptService,
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it("Should validate user by e-mail", undefined, async (context) => {
    const email = faker.internet.email();
    const password = dummyPassword;
    const hashedPassword = dummyPasswordHash;

    const user = { ...dummyUser, email, password: hashedPassword };

    const expectedValidatedUser = {
      id: user.id,
      firstName: user.firstName,
      role: user.role,
      pendingUserVerifications: undefined,
    };

    const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
      "email",
      email,
      { userVerifications: true },
    ];

    const expectedUpdateArgs: Parameters<UserService["update"]> = [
      user.id,
      { lastLoginAt: new Date(0).toISOString() },
    ];

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserService.findOneBy.mock.mockImplementationOnce(async () => user);

    mockScryptService.verify.mock.mockImplementationOnce(async () => true);

    const validatedUser = await authService.validateUser(email, password);

    assert.deepStrictEqual(
      validatedUser,
      expectedValidatedUser,
      "Validated user is different than expected",
    );
    assert.strictEqual(
      mockUserService.findOneBy.mock.callCount(),
      1,
      "UserService 'findOneBy' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserService.findOneBy.mock.calls[0].arguments,
      expectedFindOneByArgs,
      "UserService 'findOneBy' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserService.update.mock.callCount(),
      1,
      "UserService 'update' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserService.update.mock.calls[0].arguments,
      expectedUpdateArgs,
      "UserService 'update' called with unexpected arguments",
    );
  });

  it(
    "should validate user by e-mail with pending confirmations",
    undefined,
    async (context) => {
      const email = faker.internet.email();
      const password = dummyPassword;
      const hashedPassword = dummyPasswordHash;

      const user: UserEntity = {
        ...dummyUser,
        email,
        password: hashedPassword,
        userVerifications: [
          {
            id: faker.number.int(),
            createdAt: new Date(Date.now()).toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            userId: dummyUser.id,
            verificationType: "email",
            tokenHash: faker.string.hexadecimal({ length: 64 }),
            isVerified: false,
          },
        ],
      };

      const expectedValidatedUser: TValidatedUser = {
        id: user.id,
        firstName: user.firstName,
        role: user.role,
        pendingUserVerifications: ["email"],
      };

      const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
        "email",
        email,
        { userVerifications: true },
      ];

      const expectedUpdateArgs: Parameters<UserService["update"]> = [
        user.id,
        { lastLoginAt: new Date(0).toISOString() },
      ];

      context.mock.timers.enable({ apis: ["Date"], now: 0 });

      mockUserService.findOneBy.mock.mockImplementationOnce(async () => user);

      mockScryptService.verify.mock.mockImplementationOnce(async () => true);

      const validatedUser = await authService.validateUser(email, password);

      assert.deepStrictEqual(
        validatedUser,
        expectedValidatedUser,
        "Validated user is different than expected",
      );
      assert.strictEqual(
        mockUserService.findOneBy.mock.callCount(),
        1,
        "UserService 'findOneBy' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.findOneBy.mock.calls[0].arguments,
        expectedFindOneByArgs,
        "UserService 'findOneBy' called with unexpected arguments",
      );
      assert.strictEqual(
        mockUserService.update.mock.callCount(),
        1,
        "UserService 'update' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.update.mock.calls[0].arguments,
        expectedUpdateArgs,
        "UserService 'update' called with unexpected arguments",
      );
    },
  );

  it(
    "should not validate user by e-mail, user doesn't exist",
    undefined,
    async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
        "email",
        email,
        { userVerifications: true },
      ];

      mockUserService.findOneBy.mock.mockImplementationOnce(async () => null);

      const validatedUser = await authService.validateUser(email, password);

      assert.strictEqual(validatedUser, null, "Validted user should be null");
      assert.strictEqual(
        mockUserService.findOneBy.mock.callCount(),
        1,
        "UserService 'findOneBy' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.findOneBy.mock.calls[0].arguments,
        expectedFindOneByArgs,
        "UserService 'findOneBy' called with unexpected arguments",
      );
    },
  );

  it(
    "should not validate user by e-mail, incorrect password",
    undefined,
    async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
        "email",
        email,
        { userVerifications: true },
      ];

      mockUserService.findOneBy.mock.mockImplementationOnce(
        async () => dummyUser,
      );

      mockScryptService.verify.mock.mockImplementationOnce(async () => false);

      const validatedUser = await authService.validateUser(email, password);

      assert.strictEqual(validatedUser, null, "Validated user should be null");
      assert.strictEqual(
        mockUserService.findOneBy.mock.callCount(),
        1,
        "UserService 'findOneBy' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.findOneBy.mock.calls[0].arguments,
        expectedFindOneByArgs,
        "UserService 'findOneBy' called with unexpected arguments",
      );
    },
  );

  it("should validate user by phone number", undefined, async (context) => {
    const phoneNumber = faker.string.numeric(11);
    const password = dummyPassword;
    const hashedPassword = dummyPasswordHash;

    const user = { ...dummyUser, phoneNumber, password: hashedPassword };

    const expectedValidatedUser = {
      id: user.id,
      firstName: user.firstName,
      role: user.role,
      pendingUserVerifications: undefined,
    };

    const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
      "phoneNumber",
      phoneNumber,
      { userVerifications: true },
    ];

    const expectedUpdateArgs: Parameters<UserService["update"]> = [
      user.id,
      { lastLoginAt: new Date(0).toISOString() },
    ];

    context.mock.timers.enable({ apis: ["Date"], now: 0 });

    mockUserService.findOneBy.mock.mockImplementationOnce(async () => user);

    mockScryptService.verify.mock.mockImplementationOnce(async () => true);

    const validatedUser = await authService.validateUser(phoneNumber, password);

    assert.deepStrictEqual(
      validatedUser,
      expectedValidatedUser,
      "Validated user different than expected",
    );
    assert.strictEqual(
      mockUserService.findOneBy.mock.callCount(),
      1,
      "UserService 'findOneBy' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserService.findOneBy.mock.calls[0].arguments,
      expectedFindOneByArgs,
      "UserService 'findOneBy' called with unexpected arguments",
    );
    assert.strictEqual(
      mockUserService.update.mock.callCount(),
      1,
      "UserService 'update' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockUserService.update.mock.calls[0].arguments,
      expectedUpdateArgs,
      "UserService 'update' called with unexpected arguments",
    );
  });

  it(
    "should validate user by phone number with pending confirmations",
    undefined,
    async (context) => {
      const phoneNumber = faker.string.numeric(11);
      const password = dummyPassword;
      const hashedPassword = dummyPasswordHash;

      const user: UserEntity = {
        ...dummyUser,
        phoneNumber,
        password: hashedPassword,
        userVerifications: [
          {
            id: faker.number.int(),
            createdAt: faker.date.recent().toISOString(),
            expiresAt: faker.date.soon().toISOString(),
            userId: dummyUser.id,
            verificationType: "phone",
            tokenHash: faker.string.hexadecimal({ length: 64 }),
            isVerified: false,
          },
        ],
      };

      const expectedValidatedUser: TValidatedUser = {
        id: user.id,
        firstName: user.firstName,
        role: user.role,
        pendingUserVerifications: ["phone"],
      };

      const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
        "phoneNumber",
        phoneNumber,
        { userVerifications: true },
      ];

      const expectedUpdateArgs: Parameters<UserService["update"]> = [
        user.id,
        { lastLoginAt: new Date(0).toISOString() },
      ];

      context.mock.timers.enable({ apis: ["Date"], now: 0 });

      mockUserService.findOneBy.mock.mockImplementationOnce(async () => user);

      mockScryptService.verify.mock.mockImplementationOnce(async () => true);

      const validatedUser = await authService.validateUser(
        phoneNumber,
        password,
      );

      assert.deepStrictEqual(
        validatedUser,
        expectedValidatedUser,
        "Validated user is different than expected",
      );
      assert.strictEqual(
        mockUserService.findOneBy.mock.callCount(),
        1,
        "UserService 'findOneBy' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.findOneBy.mock.calls[0].arguments,
        expectedFindOneByArgs,
        "UserService 'findOneBy' called with unexpected arguments",
      );
      assert.strictEqual(
        mockUserService.update.mock.callCount(),
        1,
        "UserService 'update' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.update.mock.calls[0].arguments,
        expectedUpdateArgs,
        "UserService 'update' called with unexpected arguments",
      );
    },
  );

  it(
    "should not validate user by phone number, user doesn't exist",
    undefined,
    async () => {
      const phoneNumber = faker.string.numeric(11);
      const password = dummyPassword;

      const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
        "phoneNumber",
        phoneNumber,
        { userVerifications: true },
      ];

      mockUserService.findOneBy.mock.mockImplementationOnce(async () => null);

      const validatedUser = await authService.validateUser(
        phoneNumber,
        password,
      );

      assert.strictEqual(validatedUser, null, "Validated user should be null");
      assert.strictEqual(
        mockUserService.findOneBy.mock.callCount(),
        1,
        "UserService 'findOneBy' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.findOneBy.mock.calls[0].arguments,
        expectedFindOneByArgs,
        "UserService 'findOneBy' called with unexpected arguments",
      );
    },
  );

  it(
    "should not validate user by phone number, incorrect password",
    undefined,
    async () => {
      const phoneNumber = faker.string.numeric(11);
      const password = faker.internet.password();

      const expectedFindOneByArgs: Parameters<UserService["findOneBy"]> = [
        "phoneNumber",
        phoneNumber,
        { userVerifications: true },
      ];

      mockUserService.findOneBy.mock.mockImplementationOnce(
        async () => dummyUser,
      );

      mockScryptService.verify.mock.mockImplementationOnce(async () => false);

      const validatedUser = await authService.validateUser(
        phoneNumber,
        password,
      );

      assert.strictEqual(validatedUser, null, "Validated user should be null");
      assert.strictEqual(
        mockUserService.findOneBy.mock.callCount(),
        1,
        "UserService 'findOneBy' should be called 1 time",
      );
      assert.deepStrictEqual(
        mockUserService.findOneBy.mock.calls[0].arguments,
        expectedFindOneByArgs,
        "UserService 'findOneBy' called with unexpected arguments",
      );
    },
  );
});
