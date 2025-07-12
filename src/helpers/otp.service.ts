import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

import { ConfigService } from "@nestjs/config";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import * as speak from "speakeasy";

@Injectable()
export class OtpService {
  constructor(private configService: ConfigService) { }

  private readonly logger = new Logger(OtpService.name);
  //  derive key for encryption and decryption of otp secret
  async deriveKey(userEmail: string, userKey: string) {
    const appPass = this.configService.get("appPassword");
    const password = userEmail + appPass;

    // Derive a 32-byte key using scrypt
    const key = (await promisify(scrypt)(password, userKey, 32)) as Buffer;
    return key;
  }

  // encrypt user secret for otp generation
  async encryptUser(userEmail: string, userKey: string, secret: string) {
    const key = await this.deriveKey(userEmail, userKey);
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-ctr", key, iv);
    const encrypted = Buffer.concat([
      iv,
      cipher.update(secret, "utf8"),
      cipher.final(),
    ]);
    return encrypted;
  }

  // decrypt user secret for otp generation
  async decryptUser(userEmail: string, userKey: string, encrypted: Buffer) {
    const key = await this.deriveKey(userEmail, userKey);
    const iv = encrypted.subarray(0, 16); //change to slice if there is error
    const encryptedText = encrypted.subarray(16);
    const decipher = createDecipheriv("aes-256-ctr", key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString("utf-8");
  }

  generateOtpCode(
    secret: string,
    timeIssued?: number,
    overide?: boolean,
  ): string | null {
    const currentTime = Date.now();
    const otpExpired = timeIssued ? currentTime - timeIssued > 300000 : true; // 5 min expiry

    // Generate a new OTP if it's expired, overridden, or no timeIssued provided
    if (overide || otpExpired) {
      const otp = speak.totp({
        secret,
        encoding: "base32",
        step: 30,
      });
      this.logger.log(otp)
      return otp
    }

    // Calculate remaining time
    const remainingTime = timeIssued + 300000 - currentTime;
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);

    throw new HttpException(
      `You can request a new OTP in ${minutes} minutes and ${seconds} seconds.`,
      HttpStatus.BAD_REQUEST
    );
  }

  validateOtp(secret: string, token: string, timeIssued: number) {
    const currentTime = Date.now();
    const timeDiff = currentTime - timeIssued;
    console.log(timeDiff, "timeDiff");
    if (currentTime - timeIssued <= 300000) {
      // 300,000 milliseconds = 5 minutes
      console.log(secret, token, timeIssued, "secret, token, timeIssued");
      const isValid = speak.totp.verify({
        secret,
        encoding: "base32",
        token,
        step: 30,
        window: 5,
      });
      console.log(isValid, "isValid");
      return isValid;
    } else {
      console.log("OTP expired.");
      return false;
    }
  }

  getOtpTime() {
    const today = new Date();
    const timeIssued = today.getTime();
    const futureExpiry = Date.now() + 300000;
    const expiryDiff = (futureExpiry - timeIssued) / 60000;
    return { timeIssued, expiryDiff, futureExpiry };
  }
}
