
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// note local guard use local strategy

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
