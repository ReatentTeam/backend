import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'tenant-local') {
  constructor(private userAuthService: UserAuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string, req: any): Promise<any> {
    console.log('[Tenant Local Strategy] Validating tenant user:', email);
    const tenantDomain = req.tenantDomain;
    if (!tenantDomain) {
      throw new UnauthorizedException('Tenant domain is required');
    }

    const user = await this.userAuthService.validateUser(email, password, tenantDomain);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
} 