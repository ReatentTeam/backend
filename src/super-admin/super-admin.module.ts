import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminEntity } from './super-admin.entity';
import { OtpService } from 'src/helpers/otp.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './guards/local.strategy';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      SuperAdminEntity
    ]),
    PassportModule,
    JwtModule.register({
      secret: 'your-jwt-secret',
      signOptions: { expiresIn: '1h' },
    }),
    MailModule
  ],
  providers: [SuperAdminService, AuthService, OtpService, LocalStrategy],
  controllers: [SuperAdminController, AuthController]
})
export class SuperAdminModule {}
