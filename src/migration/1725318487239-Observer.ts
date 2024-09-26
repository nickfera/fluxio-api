import { MigrationInterface, QueryRunner } from "typeorm";

export class Observer1725318487239 implements MigrationInterface {
  name = "Observer1725318487239";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`observer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(50) NOT NULL, \`active\` tinyint(1) NOT NULL DEFAULT '1', \`area_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`observer\` ADD CONSTRAINT \`FK_8dc728b6a34c4f85e9ab14bce9e\` FOREIGN KEY (\`area_id\`) REFERENCES \`area\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`observer\` DROP FOREIGN KEY \`FK_8dc728b6a34c4f85e9ab14bce9e\``,
    );
    await queryRunner.query(`DROP TABLE \`observer\``);
  }
}
