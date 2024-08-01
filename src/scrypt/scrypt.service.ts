import { promisify } from "node:util";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";

const asyncScrypt = promisify(scrypt);

@Injectable()
export class ScryptService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const key = (await asyncScrypt(password, salt, 64)) as Buffer;

    return salt + ":" + key.toString("hex");
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, key] = hashedPassword.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = (await asyncScrypt(password, salt, 64)) as Buffer;

    return timingSafeEqual(keyBuffer, derivedKey);
  }
}
