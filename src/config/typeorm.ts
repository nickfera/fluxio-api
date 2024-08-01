import { DataSource, DataSourceOptions } from "typeorm";
import "dotenv/config";

export const dbSourceOptions: DataSourceOptions = {
  type: "mariadb",
  database: process.env.DB_NAME || "fluxio",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "password",
  entities: [__dirname + "/../**/*.entity{.js,.ts}"],
  migrations: [__dirname + "/../migration/*{.js,.ts}"],
  migrationsTableName: "migration",
  synchronize: false,
};

const dbSource = new DataSource(dbSourceOptions);

export default dbSource;
