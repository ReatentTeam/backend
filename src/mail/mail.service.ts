import { MailerService } from "@nestjs-modules/mailer";
import {  HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
    constructor(
    private readonly mailer: MailerService,
    // private readonly cache: CacheService
  ) {}
  private emailTemplates = {
    resetPassword: {
      subject: "Reset Password",
      template: "./reset-password",
      text: (context) =>
        `Hello ${context.user},\n\nYou requested to reset your password. Please use the following code to reset your password: ${context.otp}\n\nIf you did not request a password reset, please ignore this email.\n\nThanks,\nJoee Solutions`,
    },
    welcome: {
      subject: "Welcome",
      template: "./welcome",
      text: (context) =>
        `Hello ${context.user},\n\nWelcome to Reatent. We are excited to have you on board.\n\nThanks,\nReatent`,
    },
    sendLoginOtp: {
      subject: "Login OTP",
      template: "./login-otp",
      text: (context) =>
        `Hello ${context.user},\n\nYour OTP is ${context.otp}\n\nThanks,\nReatent`,
    },
    resendOtp: {
      subject: "Resend OTP",
      template: "./resend-otp",
      text: (context) =>
        `Hello ${context.user},\n\nYour OTP is ${context.otp}\n\nThanks,\nReatent`,
    },
    welcomeAdmin: {
      subject: "Welcome Admin",
      template: "./welcome-admin.hbs",
      text: (
        context
      ) => `Hello ${context.user},\n\nWelcome to Reatent as an admin.
      \n\nYour Login email:${context.email} \n\nPassword:${context.password}.\n\nThanks,\nReatent`,
    },
    welcomeTenant: {
      subject: "Welcome Tenant",
      template: "./new-tenant",
      text: (
        context
      ) => `Hello ${context.user},\n\nWelcome to Reatent as a tenant.
      \n\nYour Login email:${context.email} \n\nPassword:${context.password}.\n\nThanks,\nReatent`,
    },
    welcomeTenantUser: {
      subject: "Welcome TenantUser",
      template: "./new-tenant",
      text: (
        context
      ) => `Hello ${context.user},\n\nWelcome to Reatent as a tenant user.
      \n\nYour Login email:${context.email} \n\nPassword:${context.password}.\n\nThanks,\nReatent`,
    },
  };

  async sendMail({
    from,
    to,
    subject,
    text,
    template,
    context,
  }: {
    from?: string;
    to: string;
    subject: string;
    text: string;
    template: string;
    context: {};
  }) {
    try {
      return await this.mailer.sendMail({
        from,
        to,
        subject,
        text,
        template,
        context,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new HttpException(
        error.message || "Email service error",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendEmail<T extends keyof typeof this.emailTemplates>(
    mailType: keyof typeof this.emailTemplates,
    to: string,
    context: Parameters<(typeof this.emailTemplates)[T]["text"]>[0],
    from = "apps@Reatent@gmail.com"
  ) {
    const { subject, template, text } = this.emailTemplates[mailType];
    return await this.sendMail({
      from,
      to,
      subject,
      template,
      text: text(context),
      context,
    });
  }
}
