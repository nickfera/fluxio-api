import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { faker } from "@faker-js/faker";
import { AreaEntity } from "./area.entity";
import { AreaService } from "./area.service";
import { AreaRepository } from "./area.repository";
import { TCreateArea } from "./schema/createArea.schema";
import { TUpdateArea } from "./schema/updateArea.schema";

const dummyArea: AreaEntity = {
  id: faker.number.int(),
  createdAt: new Date(0).toISOString(),
  updatedAt: null,
  name: faker.company.name(),
  active: true,
  userId: faker.number.int(),
};

const mockAreaRepository = {
  findMany: mock.fn(async (): Promise<AreaEntity | null> => dummyArea),
  findOne: mock.fn(async (): Promise<AreaEntity | null> => dummyArea),
  save: mock.fn(async (): Promise<AreaEntity> => dummyArea),
};

describe("AreaService", undefined, () => {
  let areaService: AreaService;

  beforeEach(async () => {
    mockAreaRepository.findOne.mock.resetCalls();
    mockAreaRepository.findMany.mock.resetCalls();
    mockAreaRepository.save.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        AreaService,
        {
          provide: AreaRepository,
          useValue: mockAreaRepository,
        },
      ],
    }).compile();

    areaService = moduleRef.get<AreaService>(AreaService);
  });

  it("Should create area", async () => {
    const createArea: TCreateArea = {
      name: faker.company.name(),
      active: true,
    };
    const userId = faker.number.int();

    const expectedArea: AreaEntity = {
      id: faker.number.int(),
      createdAt: new Date(Date.now()).toISOString(),
      ...createArea,
      userId,
    };

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [
      { name: createArea.name, userId },
    ];

    const expectedSaveArgs: Parameters<AreaRepository["save"]> = [
      { ...createArea, userId },
    ];

    mockAreaRepository.findOne.mock.mockImplementationOnce(async () => null);

    mockAreaRepository.save.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => expectedArea,
    );

    const area = await areaService.create(createArea, userId);

    assert.deepStrictEqual(
      area,
      expectedArea,
      "Area entity was not created as expeced",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockAreaRepository.save.mock.callCount(),
      1,
      "AreaRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "AreaRepository 'save' called with unexpected arguments",
    );
  });

  it("Should not create area because name is being used", async () => {
    const createArea: TCreateArea = {
      name: faker.company.name(),
      active: true,
    };
    const userId = faker.number.int();

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [
      { name: createArea.name, userId },
    ];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({
        ...dummyArea,
        name: createArea.name,
      }),
    );

    await assert.rejects(
      async () => await areaService.create(createArea, userId),
      ConflictException,
      "Should throw 'ConflictException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should find area by id", async () => {
    const id = dummyArea.id;

    const expectedArea = dummyArea;

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
    );

    const area = await areaService.findOne(id);

    assert.deepStrictEqual(
      area,
      expectedArea,
      "Area entity found was not as expeced",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should find area by id of userId", async () => {
    const id = dummyArea.id;
    const userId = dummyArea.userId;

    const expectedArea = dummyArea;

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
    );

    const area = await areaService.findOne(id, userId);

    assert.deepStrictEqual(
      area,
      expectedArea,
      "Area entity found was not as expeced",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not find area by id", async () => {
    const id = faker.number.int();

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => null,
    );

    await assert.rejects(
      async () => await areaService.findOne(id),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not find area by id of userId", async () => {
    const id = dummyArea.id;
    const userId = faker.number.int();

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
    );

    await assert.rejects(
      async () => await areaService.findOne(id, userId),
      ForbiddenException,
      "Should throw 'ForbiddenException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should update area", async (context) => {
    const id = dummyArea.id;
    const name = faker.company.name();
    const active = false;

    const updateArea: TUpdateArea = {
      name,
      active,
    };

    const expectedArea: AreaEntity = {
      ...dummyArea,
      name,
      active,
      updatedAt: new Date(1000).toISOString(),
    };

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]>[] = [
      [{ id }],
      [{ name, userId: dummyArea.userId }],
    ];

    const expectedSaveArgs: Parameters<AreaRepository["save"]> = [
      { ...dummyArea, name, active },
    ];

    context.mock.timers.enable({ apis: ["Date"], now: 1000 });

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
      0,
    );

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => null,
      1,
    );

    mockAreaRepository.save.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => expectedArea,
    );

    const area = await areaService.update(id, updateArea);

    assert.deepStrictEqual(
      area,
      expectedArea,
      "Area entity was not updated as expeced",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      2,
      "AreaRepository 'findOne' should be called 2 times",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs[0],
      "AreaRepository 'findOne' called with unexpected arguments (calls[0])",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[1].arguments,
      expectedFindOneArgs[1],
      "AreaRepository 'findOne' called with unexpected arguments (calls[1])",
    );
    assert.strictEqual(
      mockAreaRepository.save.mock.callCount(),
      1,
      "AreaRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "AreaRepository 'save' called with unexpected arguments",
    );
  });

  it("Should update area of userId", async (context) => {
    const id = dummyArea.id;
    const userId = dummyArea.userId;
    const name = faker.company.name();
    const active = true;

    const updateArea: TUpdateArea = {
      name,
      active,
    };

    const expectedArea: AreaEntity = {
      ...dummyArea,
      name,
      active,
      updatedAt: new Date(1000).toISOString(),
    };

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]>[] = [
      [{ id }],
      [{ name, userId: dummyArea.userId }],
    ];

    const expectedSaveArgs: Parameters<AreaRepository["save"]> = [
      { ...dummyArea, name, active },
    ];

    context.mock.timers.enable({ apis: ["Date"], now: 1000 });

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
      0,
    );

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => null,
      1,
    );

    mockAreaRepository.save.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => expectedArea,
    );

    const area = await areaService.update(id, updateArea, userId);

    assert.deepStrictEqual(
      area,
      expectedArea,
      "Area entity was not updated as expeced",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      2,
      "AreaRepository 'findOne' should be called 2 times",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs[0],
      "AreaRepository 'findOne' called with unexpected arguments (calls[0])",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[1].arguments,
      expectedFindOneArgs[1],
      "AreaRepository 'findOne' called with unexpected arguments (calls[1])",
    );
    assert.strictEqual(
      mockAreaRepository.save.mock.callCount(),
      1,
      "AreaRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "AreaRepository 'save' called with unexpected arguments",
    );
  });

  it("Should not update area because it doesn't exist", async () => {
    const id = faker.number.int();
    const name = faker.company.name();
    const active = true;

    const updateArea: TUpdateArea = {
      name,
      active,
    };

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => null,
    );

    await assert.rejects(
      async () => await areaService.update(id, updateArea),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not update area because name is being used", async () => {
    const id = faker.number.int();
    const name = faker.company.name();
    const active = true;
    const userId = dummyArea.userId;

    const updateArea: TUpdateArea = {
      name,
      active,
    };

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]>[] = [
      [{ id }],
      [{ name, userId }],
    ];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({
        ...dummyArea,
        id,
      }),
      0,
    );

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({
        ...dummyArea,
        name,
      }),
      1,
    );

    await assert.rejects(
      async () => await areaService.update(id, updateArea),
      ConflictException,
      "Should throw 'ConflictException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      2,
      "AreaRepository 'findOne' should be called 2 times",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs[0],
      "AreaRepository 'findOne' called with unexpected arguments (calls[0])",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[1].arguments,
      expectedFindOneArgs[1],
      "AreaRepository 'findOne' called with unexpected arguments (calls[1])",
    );
  });

  it("Should not update area because user doesn't own it", async () => {
    const id = dummyArea.id;
    const name = faker.company.name();
    const active = true;
    const userId = faker.number.int();

    const updateArea: TUpdateArea = {
      name,
      active,
    };

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({
        ...dummyArea,
        id,
      }),
    );

    await assert.rejects(
      async () => await areaService.update(id, updateArea, userId),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should soft delete area", async (context) => {
    const id = dummyArea.id;
    const deletedAt = new Date(10000).toISOString();

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    const expectedSaveArgs: Parameters<AreaRepository["save"]> = [
      { ...dummyArea, deletedAt: new Date(10000).toISOString() },
    ];

    context.mock.timers.enable({ apis: ["Date"], now: 10000 });

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
    );

    mockAreaRepository.save.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({ ...dummyArea, deletedAt }),
    );

    await areaService.softDelete(id);

    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockAreaRepository.save.mock.callCount(),
      1,
      "AreaRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "AreaRepository 'save' called with unexpected arguments",
    );
  });

  it("Should soft delete area of userId", async (context) => {
    const id = dummyArea.id;
    const userId = dummyArea.userId;
    const deletedAt = new Date(10000).toISOString();

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    const expectedSaveArgs: Parameters<AreaRepository["save"]> = [
      { ...dummyArea, deletedAt },
    ];

    context.mock.timers.enable({ apis: ["Date"], now: 10000 });

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => dummyArea,
    );

    mockAreaRepository.save.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({ ...dummyArea, deletedAt }),
    );

    await areaService.softDelete(id, userId);

    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockAreaRepository.save.mock.callCount(),
      1,
      "AreaRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "AreaRepository 'save' called with unexpected arguments",
    );
  });

  it("Should not soft delete area because it doesn't exist", async () => {
    const id = dummyArea.id;

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => null,
    );

    await assert.rejects(
      async () => await areaService.softDelete(id),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not soft delete area because user doesn't own it", async () => {
    const id = dummyArea.id;
    const userId = faker.number.int();

    const expectedFindOneArgs: Parameters<AreaRepository["findOne"]> = [{ id }];

    mockAreaRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity> => ({
        ...dummyArea,
        userId: faker.number.int(),
      }),
    );

    await assert.rejects(
      async () => await areaService.softDelete(id, userId),
      NotFoundException,
      "Should throw 'NotFoundException'",
    );
    assert.strictEqual(
      mockAreaRepository.findOne.mock.callCount(),
      1,
      "AreaRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "AreaRepository 'findOne' called with unexpected arguments",
    );
  });
});
