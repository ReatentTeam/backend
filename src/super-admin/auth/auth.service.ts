import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { SuperAdminEntity } from "../super-admin.entity";
import { randomBytes } from "crypto";
import { generateSecret } from "src/helpers/generate.secret";
import * as bcrypt from "bcrypt";
import { CreateAdminDto } from "../dto/super.admin.dto";
import { OtpService } from "src/helpers/otp.service";
import { JwtService } from "@nestjs/jwt";
import { MailService } from "src/mail/mail.service";



@Injectable()
export class AuthService{
    constructor(
        @InjectRepository(SuperAdminEntity)
         private readonly superAdminRepository: Repository<SuperAdminEntity>,
        private readonly otpService: OtpService,
        @InjectDataSource() private dataSource: DataSource,
         private readonly jwtService: JwtService,
         private readonly emailService:MailService,

    ){}

     async register(createAdmindto: CreateAdminDto, file?: Express.Multer.File) {
    const existinguser = await this.superAdminRepository.findOne({
      where: { email: createAdmindto.email },
    });
    if (existinguser) {
      throw new BadRequestException("User already exists");
    }
    // const roles = await this.superAdminRepository.findOne({
    //   where: { name: createAdmindto.role },
    // });
    // if (!roles) {
    //   throw new BadRequestException("Role not found");
    // }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createAdmindto.password,
      saltRounds
    );
    // generate otp secret which is unique per individual
    const secret = generateSecret().base32;
    console.log(secret, "this is the secret");
    const key = randomBytes(16).toString("hex");
    const hashedOtpSecret = await this.otpService.encryptUser(
      createAdmindto.email,
      key,
      secret
    );


 const user = this.superAdminRepository.create({
      ...createAdmindto,
      password: hashedPassword,
    //   roles: [roles],
      user_key: key,
      otp_secret: hashedOtpSecret,
    });
    // if file is provided, upload it to the storage service
    // if (file) {
    //   const filePath = await this.storageService.uploadFile(file);
    //   user.profile_picture = filePath;
    // }

    await this.superAdminRepository.save(user);

    await this.emailService.sendEmail("welcomeAdmin", user.email, {
      user: `${user.firstName} ${user.lastName}`,
      email: `${user.email}`,
      password: `${createAdmindto.password}`,
    });

    const { password, otp_secret, user_key, ...result } = user;
    return {
      data: {
        ...result,
      },
      status: true,
      message: "User created successfully",
    };
}


async login({ user }: { user: any }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userDetails = await queryRunner.manager.findOne(SuperAdminEntity, {
        where: { email: user.email },
      });

      const today = new Date();
      if(!userDetails.isEmailVerified){
        const {
          expiryDiff,
          timeIssued,
          futureExpiry: expiredTime,
        } = this.otpService.getOtpTime();
        const decryptedKey = await this.otpService.decryptUser(
          userDetails.email,
          userDetails.user_key,
          userDetails.otp_secret
        );
        const generateOtp = this.otpService.generateOtpCode(
          decryptedKey,
          null,
          true
        );
        if (!generateOtp) {
          throw new InternalServerErrorException(
            "An error occured while generating otp"
          );
        }
        await queryRunner.manager.update(
          SuperAdminEntity,
          { id: user.id },
          {
            otp_details: {
              otp: generateOtp,
              timeIssued: timeIssued,
              expiry: new Date(expiredTime),
            },
            last_login: today,
          }
        );
        await this.emailService.sendEmail("sendLoginOtp", user.email, {
          otp: generateOtp,
          user: `${user.first_name} ${user.last_name}`,
          expiryTime: expiryDiff.toFixed(0),
        });
        const mfa_token = this.jwtService.sign(
          { email: user.email, mfa_required: true,
            mfa_type: "totp",},
          {
            secret: "makeitsecureinproduction",
            expiresIn: "1d",
          }
        );

      }
      await queryRunner.manager.update(
        SuperAdminEntity,
        { id: user.id },
        {
          last_login: today,
        }
      );
      const mfa_token = this.jwtService.sign(
        { email: user.email, mfa_required: true,
          mfa_type: "totp",},
        {
          secret: "changeitinproduction",
          expiresIn: "1d",
        }
      );
     
      await queryRunner.commitTransaction();
      return {
        data: {
          token: mfa_token,
          mfa_required: true,
          mfa_type: "totp",
        },
        status: true,
        message: "MFA required",
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error.message || "Login failed");
    } finally {
      await queryRunner.release();
    }
  }


  async validateUser(email:string, password:string){
    const user = await this.superAdminRepository.findOne({where: {email:email}})
    if (!user){
        throw new BadRequestException("Invalid credentilals")
    }
    const comparePassword = await bcrypt.compare(password, user.password)
    if (!comparePassword){
        throw new BadRequestException("Invalid credentilals")
    }
    
    return user;
  }


  async verifyLoginOtp({ otp, email }: { otp: string; email: string }) {
    console.log("aksksk");
    const user = await this.superAdminRepository.findOne({
      where: { email: email },
      // relations: ["roles"],
    });
    // console.log(user.roleNames, "ame");
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    // check if the user otp secret was created properly
    if (!user.otp_secret) {
      throw new InternalServerErrorException("Invalid");
    }
    // decrypt otp secret
    const decryptedKey = await this.otpService.decryptUser(
      user.email,
      user.user_key,
      user.otp_secret
    );
    // check if the user otp has expired
    if (!user.otp_details || !user.otp_details.expiry) {
      throw new UnauthorizedException("Otp has expired");
    }
    // compare time otp was issued with current time
    const today = new Date();
    const currentTime = today.getTime();
    if (currentTime > new Date(user.otp_details.expiry).getTime()) {
      throw new UnauthorizedException("Otp has expired");
    }
    // if false otp has epxired else if delta otp is valid
    const isValid = this.otpService.validateOtp(
      decryptedKey,
      otp.toString(),
      user.otp_details.timeIssued
    );
    if (isValid) {
      if (otp !== user.otp_details.otp) {
        throw new UnauthorizedException("Incorrect Otp");
      }
      await this.superAdminRepository.update(
        { id: user.id },
        {
          otp_details: null,
        }
      );
      const { password, otp_details, otp_secret, ...rest } = user;
      const token = this.jwtService.sign(
        { ...rest},
        {
          secret: "changeitinproduction",
          expiresIn: "1d",
        }
      );

      return {
        message: "Otp verified succesfully",
        data: {
          user: rest,
          token,
        },
        status: true,
      };
    } else {
      throw new UnauthorizedException("Invalid Otp");
    }
  }



}