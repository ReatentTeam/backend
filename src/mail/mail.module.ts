import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        // note email and password should be set in the .env file
        transport: {
          service: "Gmail",
          host: "smtp.gmail.com",
          port: config.get("mailer.port"),
          secure: true,
          // ignoreTls: true,
          auth: {
            user: config.get("mailer.email"),
            pass: config.get("mailer.password"),
          },
          defaults: `"Your App Name" <${config.get('mailer.email')}>`,
        },
        template: {
          dir: join(process.cwd(), 'src/mail/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
