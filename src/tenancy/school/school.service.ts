import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './school.dto';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createSchool(createSchoolDto: CreateSchoolDto, domain: string): Promise<School> {
    const existingSchool = await this.schoolRepository.findOne({
      where: { domain },
    });

    if (existingSchool) {
      throw new BadRequestException('School already exists for this tenant');
    }

    const school = this.schoolRepository.create({
      ...createSchoolDto,
      domain,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.schoolRepository.save(school);
  }

  async getSchoolByDomain(domain: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { domain },
    });

    if (!school) {
      throw new NotFoundException('School not found for this tenant');
    }

    return school;
  }

  async updateSchool(domain: string, updateData: Partial<CreateSchoolDto>): Promise<School> {
    const school = await this.getSchoolByDomain(domain);
    
    Object.assign(school, updateData);
    school.updatedAt = new Date();
    return await this.schoolRepository.save(school);
  }

  async deleteSchool(domain: string): Promise<void> {
    const school = await this.getSchoolByDomain(domain);
    await this.schoolRepository.remove(school);
  }

  async getAllSchools(): Promise<School[]> {
    return await this.schoolRepository.find();
  }

  async getSchoolStats(domain: string): Promise<{
    totalStudents: number;
    totalTutors: number;
  }> {
    const school = await this.getSchoolByDomain(domain);
    return {
      totalStudents: school.totalStudents,
      totalTutors: school.totalTutors,
    };
  }
}
