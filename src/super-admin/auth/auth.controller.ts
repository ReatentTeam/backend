import { Body, Controller, Post, Req, Request, UploadedFile, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateAdminDto } from "../dto/super.admin.dto";
import { LocalAuthGuard } from "../guards/local.guard";

@Controller("auth")
export class AuthController {
constructor(private readonly authService: AuthService) {}

@Post("register")
async register(@Body() createAdminDto: CreateAdminDto,  @UploadedFile() file?: Express.Multer.File) {
    console.log(createAdminDto);
    return this.authService.register(createAdminDto, file);
  }


  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login (@Request() req:any){
    return await this.authService.login(req);
  }
}