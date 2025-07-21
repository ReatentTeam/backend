import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userAuthService: UserAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') || 'tenant-user-secret',
    });
  }

  async validate(payload: any) {
    // Check if this is an MFA token (not the final token)
    if (payload.mfa_required) {
      throw new UnauthorizedException('MFA verification required');
    }

    // Validate user exists in the tenant
    const user = await this.userAuthService.findUserByEmail(
      payload.email,
      payload.domain,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      domain: payload.domain,
    };
  }
} 