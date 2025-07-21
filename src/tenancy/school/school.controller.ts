import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './school.dto';
import { TenantAuthGuard } from '../user/guards/tenant-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { RequiredRoles } from '../user/roles/role.decorator';
import { Role } from '../user/roles/role.enum';
import { PublicGuard } from '../../helpers/public.decorator';
import { Request } from 'express';

@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('info')
  @UseGuards(TenantAuthGuard, RolesGuard)
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN, Role.TEACHER, Role.STUDENT)
  async getSchoolInfo(@Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const school = await this.schoolService.getSchoolByDomain(tenantDomain);
    return {
      data: school,
      status: true,
      message: 'School information retrieved successfully',
    };
  }

  @Post('onboarding')
  @PublicGuard()
  async createSchoolOnboarding(
    @Body() createSchoolDto: CreateSchoolDto,
    @Req() req: Request,
  ) {
    const tenantDomain = req.tenantDomain;
    if (!tenantDomain) {
      throw new Error('Tenant domain is required');
    }

    const school = await this.schoolService.createSchool(createSchoolDto, tenantDomain);
    return {
      data: school,
      status: true,
      message: 'School created successfully during onboarding',
    };
  }

  @Put('update')
  @UseGuards(TenantAuthGuard, RolesGuard)
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async updateSchool(
    @Body() updateData: Partial<CreateSchoolDto>,
    @Req() req: Request,
  ) {
    const tenantDomain = req.tenantDomain;
    const school = await this.schoolService.updateSchool(tenantDomain, updateData);
    return {
      data: school,
      status: true,
      message: 'School information updated successfully',
    };
  }

  @Get('stats')
  @UseGuards(TenantAuthGuard, RolesGuard)
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async getSchoolStats(@Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    const stats = await this.schoolService.getSchoolStats(tenantDomain);
    return {
      data: stats,
      status: true,
      message: 'School statistics retrieved successfully',
    };
  }

  @Delete()
  @UseGuards(TenantAuthGuard, RolesGuard)
  @RequiredRoles(Role.Admin, Role.TENANT_ADMIN)
  async deleteSchool(@Req() req: Request) {
    const tenantDomain = req.tenantDomain;
    await this.schoolService.deleteSchool(tenantDomain);
    return {
      status: true,
      message: 'School deleted successfully',
    };
  }
} 