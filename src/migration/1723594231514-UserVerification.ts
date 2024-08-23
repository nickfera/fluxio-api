import { MigrationInterface, QueryRunner } from "typeorm";

export class UserVerification1723594231514 implements MigrationInterface {
  name = "UserVerification1723594231514";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user_verification\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NOT NULL, \`verification_type\` varchar(5) NOT NULL, \`token_hash\` varchar(255) NULL, \`expires_at\` datetime NOT NULL, \`is_verified\` tinyint(1) UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`user_verification\``);
  }
}
