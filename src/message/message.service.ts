import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  MessageEventNames,
  TSendEmailEvent,
  TSendSMSEvent,
} from "./message.events";

@Injectable()
export class MessageService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  sendEmail(eventData: TSendEmailEvent): void {
    this.eventEmitter.emit(MessageEventNames.SendEmail, eventData);
  }

  sendSMS(eventData: TSendSMSEvent): void {
    this.eventEmitter.emit(MessageEventNames.SendSMS, eventData);
  }
}
