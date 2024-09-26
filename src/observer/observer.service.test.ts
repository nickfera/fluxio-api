import { beforeEach, describe, it, mock } from "node:test";
import { strict as assert } from "node:assert";
import { Test } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { ObserverService } from "./observer.service";
import { ObserverEntity } from "./observer.entity";
import { ObserverRepository } from "./observer.repository";
import { TCreateObserver } from "./schema/createObserver.schema";
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { AreaEntity } from "src/area/area.entity";
import { AreaService } from "src/area/area.service";
import { TUpdateObserver } from "./schema/updateObserver.schema";
import { Not } from "typeorm";

const dummyObserverEntity: ObserverEntity = {
  id: faker.number.int(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: null,
  name: "Dummy Observer",
  active: true,
  areaId: faker.number.int(),
};

const dummyAreaEntity: AreaEntity = {
  id: faker.number.int(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: null,
  name: "Dummy Area",
  active: true,
  userId: faker.number.int(),
};

const mockObserverRepository = {
  findMany: mock.fn(
    async (): Promise<ObserverEntity[]> => [dummyObserverEntity],
  ),
  findOne: mock.fn(
    async (): Promise<ObserverEntity | null> => dummyObserverEntity,
  ),
  save: mock.fn(async (): Promise<ObserverEntity> => dummyObserverEntity),
  softDelete: mock.fn(async (): Promise<void> => {}),
};

const mockAreaService = {
  findOne: mock.fn(async (): Promise<AreaEntity | null> => dummyAreaEntity),
};

describe("ObserverService", undefined, () => {
  let observerService: ObserverService;

  beforeEach(async () => {
    mockObserverRepository.findOne.mock.resetCalls();
    mockObserverRepository.findMany.mock.resetCalls();
    mockObserverRepository.save.mock.resetCalls();
    mockObserverRepository.softDelete.mock.resetCalls();

    mockAreaService.findOne.mock.resetCalls();

    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        ObserverService,
        {
          provide: ObserverRepository,
          useValue: mockObserverRepository,
        },
        {
          provide: AreaService,
          useValue: mockAreaService,
        },
      ],
    }).compile();

    observerService = moduleRef.get<ObserverService>(ObserverService);
  });

  it("Should create observer", async () => {
    const createObserver: TCreateObserver = {
      name: "Main Area Observer",
      active: true,
      areaId: faker.number.int(),
    };

    const userId = faker.number.int();

    const expectedObserver: ObserverEntity = {
      id: faker.number.int(),
      createdAt: new Date(0).toISOString(),
      updatedAt: null,
      name: createObserver.name,
      active: createObserver.active,
      areaId: createObserver.areaId,
    };

    const expectedAreaFindOneArgs: Parameters<AreaService["findOne"]> = [
      createObserver.areaId,
      userId,
    ];

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { name: createObserver.name, areaId: createObserver.areaId },
    ];

    const expectedSaveArgs: Parameters<ObserverRepository["save"]> = [
      createObserver,
    ];

    mockAreaService.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => ({ ...dummyAreaEntity, userId }),
    );

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
    );

    mockObserverRepository.save.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity> => expectedObserver,
    );

    const observer = await observerService.create(createObserver, userId);

    assert.deepStrictEqual(
      observer,
      expectedObserver,
      "Observer was not created as expected",
    );

    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );

    assert.strictEqual(
      mockAreaService.findOne.mock.callCount(),
      1,
      "AreaService 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaService.findOne.mock.calls[0].arguments,
      expectedAreaFindOneArgs,
      "AreaService 'findOne' called with unexpected arguments",
    );

    assert.strictEqual(
      mockObserverRepository.save.mock.callCount(),
      1,
      "ObserverRepository 'save' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.save.mock.calls[0].arguments,
      expectedSaveArgs,
      "ObserverRepository 'save' called with unexpected arguments",
    );
  });

  it("Should not create observer because user's area was not found", async () => {
    const createObserver: TCreateObserver = {
      name: "Main Area Observer",
      active: true,
      areaId: faker.number.int(),
    };

    const userId = faker.number.int();

    const expectedAreaFindOneArgs: Parameters<AreaService["findOne"]> = [
      createObserver.areaId,
      userId,
    ];

    mockAreaService.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => {
        throw new NotFoundException("Area not found.");
      },
    );

    await assert.rejects(
      async () => await observerService.create(createObserver, userId),
      NotFoundException,
      "Should throw NotFoundException",
    );

    assert.strictEqual(
      mockAreaService.findOne.mock.callCount(),
      1,
      "AreaService 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaService.findOne.mock.calls[0].arguments,
      expectedAreaFindOneArgs,
      "AreaService 'findOne' called with unexpected arguments",
    );
  });

  it("Should not create observer beause the name is being used", async () => {
    const createObserver: TCreateObserver = {
      name: "Main Area Observer",
      active: true,
      areaId: faker.number.int(),
    };

    const userId = faker.number.int();

    const expectedAreaFindOneArgs: Parameters<AreaService["findOne"]> = [
      createObserver.areaId,
      userId,
    ];

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { name: createObserver.name, areaId: createObserver.areaId },
    ];

    mockAreaService.findOne.mock.mockImplementationOnce(
      async (): Promise<AreaEntity | null> => null,
    );

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => ({
        ...dummyObserverEntity,
        name: createObserver.name,
        areaId: createObserver.areaId,
      }),
    );

    await assert.rejects(
      async () => await observerService.create(createObserver, userId),
      ConflictException,
      "Should throw ConflictException",
    );

    assert.strictEqual(
      mockAreaService.findOne.mock.callCount(),
      1,
      "AreaService 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockAreaService.findOne.mock.calls[0].arguments,
      expectedAreaFindOneArgs,
      "AreaService 'findOne' called with unexpected arguments",
    );

    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should find observer", async () => {
    const id = faker.number.int();

    const expectedObserver: ObserverEntity = {
      ...dummyObserverEntity,
      id,
    };

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity> => ({ ...dummyObserverEntity, id }),
    );

    const observer = await observerService.findOne({ id });

    assert.deepStrictEqual(
      observer,
      expectedObserver,
      "Observer found is not as expected",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not find observer and throw exception", async () => {
    const id = faker.number.int();

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
    );

    await assert.rejects(
      async () => await observerService.findOne({ id }),
      NotFoundException,
      "Should throw NotFoundException",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should find observers by areaId", async () => {
    const areaId = faker.number.int();

    const expectedObserver: ObserverEntity = {
      ...dummyObserverEntity,
      areaId,
    };

    const expectedFindManyArgs: Parameters<ObserverRepository["findMany"]> = [
      { areaId },
    ];

    mockObserverRepository.findMany.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity[]> => [expectedObserver],
    );

    const observers = await observerService.findMany(areaId);

    assert.deepStrictEqual(
      observers,
      [expectedObserver],
      "Observers found are not as expected",
    );
    assert.strictEqual(
      mockObserverRepository.findMany.mock.callCount(),
      1,
      "ObserverRepository 'findMany' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findMany.mock.calls[0].arguments,
      expectedFindManyArgs,
      "ObserverRepository 'findMany' called with unexpected arguments",
    );
  });

  it("Should find observers by areaId and userId", async () => {
    const areaId = faker.number.int();
    const userId = faker.number.int();

    const expectedObserver: ObserverEntity = {
      ...dummyObserverEntity,
      areaId,
    };

    const expectedFindManyArgs: Parameters<ObserverRepository["findMany"]> = [
      { areaId, area: { userId } },
    ];

    mockObserverRepository.findMany.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity[]> => [expectedObserver],
    );

    const observers = await observerService.findMany(areaId, userId);

    assert.deepStrictEqual(
      observers,
      [expectedObserver],
      "Observers found are not as expected",
    );
    assert.strictEqual(
      mockObserverRepository.findMany.mock.callCount(),
      1,
      "ObserverRepository 'findMany' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findMany.mock.calls[0].arguments,
      expectedFindManyArgs,
      "ObserverRepository 'findMany' called with unexpected arguments",
    );
  });

  it("Should search for observers by areaId and return empty array", async () => {
    const areaId = faker.number.int();

    const expectedFindManyArgs: Parameters<ObserverRepository["findMany"]> = [
      { areaId },
    ];

    mockObserverRepository.findMany.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity[]> => [],
    );

    const observers = await observerService.findMany(areaId);

    assert.deepStrictEqual(
      observers,
      [],
      "Observers found are not as expected",
    );
    assert.strictEqual(
      mockObserverRepository.findMany.mock.callCount(),
      1,
      "ObserverRepository 'findMany' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findMany.mock.calls[0].arguments,
      expectedFindManyArgs,
      "ObserverRepository 'findMany' called with unexpected arguments",
    );
  });

  it("Should search for observers by areaId and userId, and return empty array", async () => {
    const areaId = faker.number.int();
    const userId = faker.number.int();

    const expectedFindManyArgs: Parameters<ObserverRepository["findMany"]> = [
      { areaId, area: { userId } },
    ];

    mockObserverRepository.findMany.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity[]> => [],
    );

    const observers = await observerService.findMany(areaId, userId);

    assert.deepStrictEqual(
      observers,
      [],
      "Observers found are not as expected",
    );
    assert.strictEqual(
      mockObserverRepository.findMany.mock.callCount(),
      1,
      "ObserverRepository 'findMany' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findMany.mock.calls[0].arguments,
      expectedFindManyArgs,
      "ObserverRepository 'findMany' called with unexpected arguments",
    );
  });

  it("Should update observer by id", async () => {
    const id = faker.number.int();
    const name = "Updated Observer";
    const active = false;

    const expectedObserver: ObserverEntity = {
      ...dummyObserverEntity,
      updatedAt: faker.date
        .future({
          refDate: dummyObserverEntity.createdAt,
        })
        .toISOString(),
      name,
      active,
    };

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]>[] = [
      [{ id }],
      [{ id: Not(id), areaId: dummyObserverEntity.areaId, name }],
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => dummyObserverEntity,
      0,
    );

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
      1,
    );

    mockObserverRepository.save.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity> => expectedObserver,
    );

    const observer = await observerService.update(id, { name, active });

    assert.deepStrictEqual(
      observer,
      expectedObserver,
      "Updated observer not as expected",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      2,
      "ObserverRepository 'findOne' should be called 2 times",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs[0],
      "ObserverRepository 'findOne' called with unexpected arguments in call 0",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[1].arguments,
      expectedFindOneArgs[1],
      "ObserverRepository 'findOne' called with unexpected arguments in call 1",
    );
  });

  it("Should not update observer by id because it does not exist", async () => {
    const id = faker.number.int();
    const name = "Updated Observer";
    const active = false;

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
    );

    await assert.rejects(
      async () => await observerService.update(id, { name, active }),
      NotFoundException,
      "Should throw NotFoundException",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not update observer by id because the name is being used", async () => {
    const id = faker.number.int();
    const name = "Updated Observer";
    const active = false;

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]>[] = [
      [{ id }],
      [{ id: Not(id), areaId: dummyObserverEntity.areaId, name }],
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => dummyObserverEntity,
      0,
    );

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => ({
        ...dummyObserverEntity,
        id: faker.number.int(),
        name,
      }),
      1,
    );

    await assert.rejects(
      async () => await observerService.update(id, { name, active }),
      ConflictException,
      "Should throw ConflictException",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      2,
      "ObserverRepository 'findOne' should be called 2 times",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs[0],
      "ObserverRepository 'findOne' called with unexpected arguments in call 0",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[1].arguments,
      expectedFindOneArgs[1],
      "ObserverRepository 'findOne' called with unexpected arguments in call 1",
    );
  });

  it("Should not update observer by id because user is not the owner", async () => {
    const id = faker.number.int();
    const userId = faker.number.int();
    const name = "Updated Observer";
    const active = false;

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id, area: { userId } },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
    );

    await assert.rejects(
      async () => await observerService.update(id, { name, active }, userId),
      NotFoundException,
      "Should throw NotFoundException",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should soft delete observer", async () => {
    const id = faker.number.int();

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => ({
        ...dummyObserverEntity,
        id,
      }),
    );

    await assert.doesNotReject(
      async () => await observerService.softDelete(id),
      "Should not throw",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
    assert.strictEqual(
      mockObserverRepository.softDelete.mock.callCount(),
      1,
      "ObserverRepository 'softDelete' should be called 1 time",
    );
  });

  it("Should not soft delete observer because it does not exist", async () => {
    const id = faker.number.int();

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
    );

    await assert.rejects(
      async () => observerService.softDelete(id),
      NotFoundException,
      "should throw NotFoundException",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });

  it("Should not soft delete observer because user is not the owner", async () => {
    const id = faker.number.int();
    const userId = faker.number.int();

    const expectedFindOneArgs: Parameters<ObserverRepository["findOne"]> = [
      { id, area: { userId } },
    ];

    mockObserverRepository.findOne.mock.mockImplementationOnce(
      async (): Promise<ObserverEntity | null> => null,
    );

    await assert.rejects(
      async () => observerService.softDelete(id, userId),
      NotFoundException,
      "should throw NotFoundException",
    );
    assert.strictEqual(
      mockObserverRepository.findOne.mock.callCount(),
      1,
      "ObserverRepository 'findOne' should be called 1 time",
    );
    assert.deepStrictEqual(
      mockObserverRepository.findOne.mock.calls[0].arguments,
      expectedFindOneArgs,
      "ObserverRepository 'findOne' called with unexpected arguments",
    );
  });
});
