import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterUser1723597865559 implements MigrationInterface {
  name = "AlterUser1723597865559";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`last_login_at\` datetime NULL AFTER \`deleted_at\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`last_login_at\``,
    );
  }
}
