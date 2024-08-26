export const MessageEventNames = {
  SendEmail: "message.send.email" as const,
  SendSMS: "message.send.sms" as const,
  MessageError: "message.error" as const,
};

type TSendBaseEvent = {
  recipient: string;
  message: string;
};

export type TSendEmailEvent = { subject: string } & TSendBaseEvent;

export type TSendSMSEvent = TSendBaseEvent;

export type TMessageErrorEvent = {
  eventName:
    | typeof MessageEventNames.SendEmail
    | typeof MessageEventNames.SendSMS;
  recipient: string;
  error: Error;
};
