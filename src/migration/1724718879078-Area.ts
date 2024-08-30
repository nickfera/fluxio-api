import { MigrationInterface, QueryRunner } from "typeorm";

export class Area1724718879078 implements MigrationInterface {
  name = "Area1724718879078";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`area\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`name\` varchar(50) NOT NULL, \`active\` tinyint(1) NOT NULL DEFAULT '1', \`user_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`area\` ADD CONSTRAINT \`FK_b9bb7958b54e60b31a92ad58bfb\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_verification\` ADD CONSTRAINT \`FK_3d40c1993bffba775f0ffad0cae\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_verification\` DROP FOREIGN KEY \`FK_3d40c1993bffba775f0ffad0cae\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`area\` DROP FOREIGN KEY \`FK_b9bb7958b54e60b31a92ad58bfb\``,
    );
    await queryRunner.query(`DROP TABLE \`area\``);
  }
}
