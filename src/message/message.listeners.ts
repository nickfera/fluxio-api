import { Injectable, Logger } from "@nestjs/common";
import {
  MessageEventNames,
  TMessageErrorEvent,
  TSendEmailEvent,
  TSendSMSEvent,
} from "./message.events";
import { OnEvent } from "@nestjs/event-emitter";
import { sleep } from "src/common/utils/sleep.util";

@Injectable()
export class MessageEventListeners {
  private readonly logger = new Logger(MessageEventListeners.name);

  @OnEvent(MessageEventNames.SendEmail)
  async handleSendEmailEvent(event: TSendEmailEvent): Promise<void> {
    try {
      this.logger.debug(`Sending e-mail to ${event.recipient}...`);

      this.logger.debug(
        `Subject: "${event.subject}"; Message: "${event.message}"`,
      );

      await sleep(1000);

      this.logger.debug(`E-mail sent to ${event.recipient}.`);
    } catch (error) {}
  }

  @OnEvent(MessageEventNames.SendSMS)
  async handleSendSMSEvent(event: TSendSMSEvent): Promise<void> {
    try {
      this.logger.debug(`Sending SMS to ${event.recipient}...`);

      this.logger.debug(`Message: ${event.message}`);

      await sleep(1000);

      this.logger.debug(`SMS sent to ${event.recipient}.`);
    } catch (error) {}
  }

  @OnEvent(MessageEventNames.MessageError)
  async handleMessageErrorEvent(event: TMessageErrorEvent): Promise<void> {
    let message = `Message event '${event.eventName}' failed for recipient ${event.recipient}`;

    if (event.error.message) {
      message += `Error: ${event.error.message}`;
    }

    this.logger.error(message);
  }
}
