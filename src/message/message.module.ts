import { Module } from "@nestjs/common";
import { MessageEventListeners } from "./message.listeners";
import { MessageService } from "./message.service";

@Module({
  imports: [],
  providers: [MessageEventListeners, MessageService],
  exports: [MessageService],
})
export class MessageModule {}
