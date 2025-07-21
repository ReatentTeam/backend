import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './school.entity';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([School]),
  ],
  providers: [SchoolService,JwtService],
  controllers: [SchoolController],
  exports: [SchoolService],
})
export class SchoolModule {}
