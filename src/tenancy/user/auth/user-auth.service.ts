import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entity/User.entity';
import * as bcrypt from 'bcrypt';
import { OtpService } from '../../../helpers/otp.service';
import { MailService } from '../../../mail/mail.service';
import { randomBytes } from 'crypto';
import { generateSecret } from '../../../helpers/generate.secret';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';

@Injectable()
export class UserAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async register(createUserDto: CreateUserDto, tenantDomain: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email, domain: tenantDomain },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists in this tenant');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Generate OTP secret
    const secret = generateSecret().base32;
    const key = randomBytes(16).toString('hex');
    const hashedOtpSecret = await this.otpService.encryptUser(
      createUserDto.email,
      key,
      secret,
    );

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      domain: tenantDomain,
      user_key: key,
      otp_secret: hashedOtpSecret,
      role: createUserDto.role || 'Student', // Default role
    });

    await this.userRepository.save(user);

    // Send welcome email
    await this.mailService.sendEmail('welcomeTenantUser', user.email, {
      user: `${user.firstname} ${user.lastname}`,
      email: user.email,
      password: createUserDto.password,
    });

    const { password, otp_secret, user_key, ...result } = user;
    return {
      data: result,
      status: true,
      message: 'User created successfully',
    };
  }

  async login(loginUserDto: LoginUserDto, tenantDomain: string) {
    const user = await this.userRepository.findOne({
      where: { email: loginUserDto.email, domain: tenantDomain },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginUserDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate OTP for login
    const { timeIssued, expiryDiff, futureExpiry } = this.otpService.getOtpTime();
    
    const decryptedKey = await this.otpService.decryptUser(
      user.email,
      user.user_key,
      user.otp_secret,
    );

    const generateOtp = this.otpService.generateOtpCode(decryptedKey, null, true);
    if (!generateOtp) {
      throw new InternalServerErrorException('Failed to generate OTP');
    }

    // Update user with OTP details
    await this.userRepository.update(
      { id: user.id },
      {
        otp_details: {
          otp: generateOtp,
          timeIssued: timeIssued,
          expiry: new Date(futureExpiry),
        },
        last_login: new Date(),
      },
    );

    // Send OTP email
    await this.mailService.sendEmail('sendLoginOtp', user.email, {
      otp: generateOtp,
      user: `${user.firstname} ${user.lastname}`,
      expiryTime: expiryDiff.toFixed(0),
    });

    // Generate MFA token
    const mfa_token = this.jwtService.sign(
      {
        email: user.email,
        domain: tenantDomain,
        mfa_required: true,
        mfa_type: 'totp',
      },
      {
        secret: process.env.JWT_SECRET || 'tenant-user-secret',
        expiresIn: '1d',
      },
    );

    return {
      data: {
        token: mfa_token,
        mfa_required: true,
        mfa_type: 'totp',
      },
      status: true,
      message: 'MFA required',
    };
  }

  async verifyLoginOtp(verifyOtpDto: VerifyOtpDto, tenantDomain: string) {
    const user = await this.userRepository.findOne({
      where: { email: verifyOtpDto.email, domain: tenantDomain },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.otp_secret) {
      throw new InternalServerErrorException('Invalid user configuration');
    }

    // Check OTP expiry
    if (!user.otp_details || !user.otp_details.expiry) {
      throw new UnauthorizedException('OTP has expired');
    }

    const currentTime = new Date().getTime();
    if (currentTime > new Date(user.otp_details.expiry).getTime()) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Decrypt and validate OTP
    const decryptedKey = await this.otpService.decryptUser(
      user.email,
      user.user_key,
      user.otp_secret,
    );

    const isValid = this.otpService.validateOtp(
      decryptedKey,
      verifyOtpDto.otp.toString(),
      user.otp_details.timeIssued,
    );

    if (!isValid || verifyOtpDto.otp !== user.otp_details.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP details
    await this.userRepository.update(
      { id: user.id },
      { otp_details: null },
    );

    // Generate final token with user info and role
    const { password, otp_details, otp_secret, user_key, ...userInfo } = user;
    const token = this.jwtService.sign(
      {
        ...userInfo,
        domain: tenantDomain,
      },
      {
        secret: process.env.JWT_SECRET || 'tenant-user-secret',
        expiresIn: '24h',
      },
    );

    return {
      message: 'OTP verified successfully',
      data: {
        user: userInfo,
        token,
      },
      status: true,
    };
  }

  async validateUser(email: string, password: string, domain: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email, domain },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    return user;
  }

  async findUserByEmail(email: string, domain: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { email, domain },
    });
  }

  async updateUserRole(userId: number, newRole: string, domain: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, domain },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.role = newRole;
    return await this.userRepository.save(user);
  }
} 