import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {UserService}  from './user.service';
import { UserAuthService } from './auth/user-auth.service';
import { TenantAuthGuard } from './guards/tenant-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RequiredRoles } from './roles/role.decorator';
import { Role } from './roles/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { Request } from 'express';

@Controller('user')
@UseGuards(TenantAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userAuthService: UserAuthService,
  ) {}

  @Get('profile')
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN, Role.TEACHER, Role.STUDENT)
  async getProfile(@Req() req: Request) {
    const user = req['user'];
    return {
      data: user,
      status: true,
      message: 'Profile retrieved successfully',
    };
  }

  @Get('users')
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async getAllUsers(@Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const users = await this.userService.findAllUsers(tenantDomain);
    return {
      data: users,
      status: true,
      message: 'Users retrieved successfully',
    };
  }

  @Get('users/:id')
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async getUserById(@Param('id') id: number, @Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const user = await this.userService.findUserById(id, tenantDomain);
    return {
      data: user,
      status: true,
      message: 'User retrieved successfully',
    };
  }

  @Post('users')
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const user = await this.userAuthService.register(createUserDto, tenantDomain);
    return {
      data: user,
      status: true,
      message: 'User created successfully',
    };
  }

  @Put('users/:id/role')
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async updateUserRole(
    @Param('id') id: number,
    @Body() body: { role: Role },
    @Req() req: Request,
  ) {
    const tenantDomain = req.tenantDomain;
    const user = await this.userAuthService.updateUserRole(
      id,
      body.role,
      tenantDomain,
    );
    return {
      data: user,
      status: true,
      message: 'User role updated successfully',
    };
  }

  @Delete('users/:id')
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async deleteUser(@Param('id') id: number, @Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    await this.userService.deleteUser(id, tenantDomain);
    return {
      status: true,
      message: 'User deleted successfully',
    };
  }

  // Teacher-specific endpoints
  @Get('students')
  @RequiredRoles(Role.TEACHER)
  async getStudents(@Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const students = await this.userService.findUsersByRole(
      Role.STUDENT,
      tenantDomain,
    );
    return {
      data: students,
      status: true,
      message: 'Students retrieved successfully',
    };
  }

  // Student-specific endpoints
  @Get('teachers')
  @RequiredRoles(Role.STUDENT)
  async getTeachers(@Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const teachers = await this.userService.findUsersByRole(
      Role.TEACHER,
      tenantDomain,
    );
    return {
      data: teachers,
      status: true,
      message: 'Teachers retrieved successfully',
    };
  }
}
