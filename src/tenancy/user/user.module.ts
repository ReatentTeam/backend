import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from './entity/User.entity';
import {UserService} from './user.service';
import { UserController } from './user.controller';
import { UserAuthService } from './auth/user-auth.service';
import { UserAuthController } from './auth/user-auth.controller';
import { JwtStrategy } from './auth/jwt.strategy';
import { LocalStrategy as UserLocalStrategy } from './auth/local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { TenantAuthGuard } from './guards/tenant-auth.guard';
import { MailModule } from '../../mail/mail.module';
import { OtpService } from '../../helpers/otp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tenant-user-secret',
      signOptions: { expiresIn: '24h' },
    }),
    MailModule,
  ],
  providers: [
    UserService,
    UserAuthService,
    UserLocalStrategy,
    JwtStrategy,
    RolesGuard,
    TenantAuthGuard,
    OtpService,
  ],
  controllers: [UserController, UserAuthController],
  exports: [UserService, UserAuthService],
})
export class UserModule {}
