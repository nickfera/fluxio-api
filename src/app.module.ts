import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dbSourceOptions } from "./config/typeorm";
import { UserModule } from "./user/user.module";

@Module({
  imports: [TypeOrmModule.forRoot(dbSourceOptions), UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
