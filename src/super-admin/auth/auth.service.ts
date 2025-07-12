import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { SuperAdminEntity } from "../super-admin.entity";
import { randomBytes } from "crypto";
import { generateSecret } from "src/helpers/generate.secret";
import * as bcrypt from "bcrypt";
import { CreateAdminDto } from "../dto/super.admin.dto";
import { OtpService } from "src/helpers/otp.service";
import { JwtService } from "@nestjs/jwt";



@Injectable()
export class AuthService{
    constructor(
        @InjectRepository(SuperAdminEntity)
         private readonly superAdminRepository: Repository<SuperAdminEntity>,
        private readonly otpService: OtpService,
        @InjectDataSource() private dataSource: DataSource,
         private readonly jwtService: JwtService,

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
    //   const today = new Date();

    //   const {
    //     expiryDiff,
    //     timeIssued,
    //     futureExpiry: expiredTime,
    //   } = this.otpService.getOtpTime();
    //   const decryptedKey = await this.otpService.decryptUser(
    //     userDetails.email,
    //     userDetails.user_key,
    //     userDetails.otp_secret
    //   );
    //   const generateOtp = this.otpService.generateOtpCode(
    //     decryptedKey,
    //     null,
    //     true
    //   );
    //   if (!generateOtp) {
    //     throw new InternalServerErrorException(
    //       "An error occured while generating otp"
    //     );
    //   }
    //   await queryRunner.manager.update(
        // SuperAdminEntity,
    //     { id: user.id },
    //     {
    //       otp_details: {
    //         otp: generateOtp,
    //         timeIssued: timeIssued,
    //         expiry: new Date(expiredTime),
    //       },
    //       last_login: today,
    //     }
    //   );
    //   await this.emailService.sendEmail("sendLoginOtp", user.email, {
    //     otp: generateOtp,
    //     user: `${user.first_name} ${user.last_name}`,
    //     expiryTime: expiryDiff.toFixed(0),
    //   });
      const mfa_token = this.jwtService.sign(
        { email: user.email, id: userDetails.id , firstName: userDetails.firstName, lastName: userDetails.lastName },
        {
          secret: "qwertyuiop",
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


}