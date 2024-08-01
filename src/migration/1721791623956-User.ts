import { MigrationInterface, QueryRunner } from "typeorm";

export class User1721791623956 implements MigrationInterface {
  name = "User1721791623956";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`first_name\` varchar(50) NOT NULL, \`last_name\` varchar(50) NOT NULL, \`email\` varchar(255) NULL, \`phone_number\` varchar(20) NULL, \`password\` varchar(161) NOT NULL, \`role\` varchar(7) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
