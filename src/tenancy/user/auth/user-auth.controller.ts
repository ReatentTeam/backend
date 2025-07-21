import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { LocalAuthGuard } from './local.guard';
import { PublicGuard } from '../../../helpers/public.decorator';
import { Request } from 'express';

@Controller('user/auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('register')
  @PublicGuard()
  async register(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ) {
    const tenantDomain = req.tenantDomain;
    if (!tenantDomain) {
      throw new Error('Tenant domain is required');
    }
    return await this.userAuthService.register(createUserDto, tenantDomain);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @PublicGuard()
  async login(@Body() loginUserDto: LoginUserDto, @Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    if (!tenantDomain) {
      throw new Error('Tenant domain is required');
    }
    return await this.userAuthService.login(loginUserDto, tenantDomain);
  }

  @Post('verify-otp')
  @PublicGuard()
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    if (!tenantDomain) {
      throw new Error('Tenant domain is required');
    }
    return await this.userAuthService.verifyLoginOtp(verifyOtpDto, tenantDomain);
  }
} 