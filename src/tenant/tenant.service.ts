import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { Repository } from 'typeorm';
import { TenantDto } from './tenant.dto';
import { getTenantConnection } from './tenant.config';
import { User } from 'src/tenancy/user/entity/User.entity';
import { School } from 'src/tenancy/school/school.entity';
import { SchoolService } from 'src/tenancy/school/school.service';
import { UserAuthService } from 'src/tenancy/user/auth/user-auth.service';
import { MailService } from 'src/mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { generateSecret } from 'src/helpers/generate.secret';
import { OtpService } from 'src/helpers/otp.service';

@Injectable()
export class TenantService {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(School)
        private readonly schoolRepository: Repository<School>,
        private readonly schoolService: SchoolService,
        private readonly userAuthService: UserAuthService,
        private readonly mailService: MailService,
        private readonly otpService: OtpService,
    ){}

    async createTenant(dto: TenantDto) {
        console.log('Creating tenant with data:', dto);
        
        // Check if tenant already exists
        const existingTenant = await this.getTenantByDomain(dto.domain);
        if (existingTenant) {
            throw new Error(`Tenant with domain '${dto.domain}' already exists`);
        }
        
        // 1. Create the tenant
        let newTenant = this.tenantRepository.create({
            name: dto.name,
            domain: dto.domain,
        });
        newTenant = await this.tenantRepository.save(newTenant);

        // 2. Create tenant schema using the main connection
        const newSchema = `tenant_${newTenant.domain}`;
        await this.tenantRepository.manager.query(
            `CREATE SCHEMA IF NOT EXISTS "${newSchema}";`
        );

        // 3. Create tenant connection and let TypeORM create tables automatically
        let connection: any = null;
        try {
            console.log('Creating tenant connection for:', newTenant.domain);
            connection = await getTenantConnection(newTenant.domain);
            console.log('Connection created successfully, tables should be created automatically via synchronize');
            
            // Verify tables were created
            const tables = await connection.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'tenant_${newTenant.domain}'
                AND table_name IN ('user', 'school')
            `);
            console.log('Tables found in tenant schema:', tables);
            
        } catch (error) {
            console.error('Error creating tenant connection:', error);
            // Clean up the tenant if connection fails
            await this.tenantRepository.remove(newTenant);
            throw new Error(`Failed to set up tenant database: ${error.message}`);
        } finally {
            if (connection && connection.isInitialized) {
                console.log('Destroying tenant connection');
                await connection.destroy();
            }
        }

        // 4. Create school if school information is provided
        let school = null;
        if (dto.schoolName && dto.schoolAddress) {
            school = await this.createSchoolForTenant(dto, newTenant.domain);
        }

        // 5. Create admin user with OTP setup
        const adminUser = await this.createAdminUserForTenant(dto, newTenant.domain);

        // 6. Send welcome email to admin
        await this.sendWelcomeEmail(adminUser, dto);

        return {
            tenant: newTenant,
            school: school,
            adminUser: {
                id: adminUser.id,
                email: adminUser.email,
                firstname: adminUser.firstname,
                lastname: adminUser.lastname,
                role: adminUser.role,
            },
            message: 'Tenant created successfully with school and admin user',
        };
    }

    private async createTenantTablesManually(domain: string): Promise<void> {
        const schema = `tenant_${domain}`;
        
        console.log(`Creating tables manually for tenant schema: ${schema}`);
        
        // Create User table in tenant schema
        await this.tenantRepository.manager.query(`
            CREATE TABLE IF NOT EXISTS "${schema}"."user" (
                "id" SERIAL PRIMARY KEY,
                "firstname" character varying NOT NULL,
                "lastname" character varying NOT NULL,
                "email" character varying NOT NULL UNIQUE,
                "password" character varying NOT NULL,
                "domain" character varying NOT NULL,
                "role" character varying NOT NULL,
                "otp_secret" bytea,
                "otp_details" jsonb,
                "user_key" character varying,
                "last_login" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        // Create School table in tenant schema
        await this.tenantRepository.manager.query(`
            CREATE TABLE IF NOT EXISTS "${schema}"."school" (
                "id" SERIAL PRIMARY KEY,
                "name" character varying NOT NULL,
                "address" character varying NOT NULL,
                "country" character varying NOT NULL,
                "state" character varying NOT NULL,
                "phone" character varying NOT NULL,
                "email" character varying NOT NULL UNIQUE,
                "website" character varying NOT NULL,
                "domain" character varying NOT NULL,
                "schoolType" character varying NOT NULL,
                "totalStudents" integer NOT NULL,
                "totalTutors" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);
        
        console.log(`Tables created successfully for tenant: ${domain}`);
    }

    private async createSchoolForTenant(dto: TenantDto, domain: string): Promise<School> {
        const schema = `tenant_${domain}`;
        
        // Create school directly in tenant schema
        const schoolData = {
            name: dto.schoolName,
            address: dto.schoolAddress,
            country: dto.country || 'Unknown',
            state: dto.state || 'Unknown',
            phone: dto.phone || '',
            email: dto.email,
            website: dto.website || '',
            schoolType: dto.schoolType || 'General',
            totalStudents: dto.totalStudents || 0,
            totalTutors: dto.totalTutors || 0,
        };

        const result = await this.tenantRepository.manager.query(`
            INSERT INTO "${schema}"."school" (
                "name", "address", "country", "state", "phone", "email", 
                "website", "domain", "schoolType", "totalStudents", "totalTutors", 
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            schoolData.name,
            schoolData.address,
            schoolData.country,
            schoolData.state,
            schoolData.phone,
            schoolData.email,
            schoolData.website,
            domain,
            schoolData.schoolType,
            schoolData.totalStudents,
            schoolData.totalTutors,
            new Date(),
            new Date()
        ]);

        return result[0];
    }

    private async createAdminUserForTenant(dto: TenantDto, domain: string): Promise<User> {
        const schema = `tenant_${domain}`;
        
        // Generate secure password
        const password = "Default@123";
        console.log(password)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP secret for admin user
        const secret = generateSecret().base32;
        const key = randomBytes(16).toString('hex');
        const hashedOtpSecret = await this.otpService.encryptUser(
            dto.email,
            key,
            secret,
        );

        // Create admin user directly in tenant schema
        const result = await this.tenantRepository.manager.query(`
            INSERT INTO "${schema}"."user" (
                "email", "password", "firstname", "lastname", "domain", "role",
                "user_key", "otp_secret", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            dto.email,
            hashedPassword,
            dto.firstname,
            dto.lastname,
            domain,
            'Tenant_Admin',
            key,
            hashedOtpSecret,
            new Date(),
            new Date()
        ]);

        const savedUser = result[0];
        
        // Store the plain password temporarily for email
        (savedUser as any).plainPassword = password;

        return savedUser;
    }

   

    private async sendWelcomeEmail(user: User, dto: TenantDto): Promise<void> {
        try {
            await this.mailService.sendEmail('welcomeTenant', user.email, {
                user: `${user.firstname} ${user.lastname}`,
                email: user.email,
                password: (user as any).plainPassword,
                tenantName: dto.name,
                loginUrl: `https://${dto.domain}.reatent.com/login`, // Add login URL
            });
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }
    }

    async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
        return this.tenantRepository.findOne({ where: { domain } });
    }

    async getAllTenants(): Promise<Tenant[]> {
        return this.tenantRepository.find();
    }

    async deleteTenant(domain: string): Promise<void> {
        const tenant = await this.getTenantByDomain(domain);
        if (tenant) {
            // Delete school
            try {
                await this.schoolService.deleteSchool(domain);
            } catch (error) {
                console.error('Error deleting school:', error);
            }

            // Delete tenant
            await this.tenantRepository.remove(tenant);
            
            // Drop schema
            const schemaName = `tenant_${domain}`;
            await this.tenantRepository.manager.query(
                `DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`
            );
        }
    }

    async getTenantWithDetails(domain: string): Promise<{
        tenant: Tenant;
        school?: School;
        adminUser?: any;
    }> {
        const tenant = await this.getTenantByDomain(domain);
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        const school = await this.schoolService.getSchoolByDomain(domain).catch(() => null);
        const adminUser = await this.userRepository.findOne({
            where: { domain, role: 'Tenant_Admin' },
            select: ['id', 'email', 'firstname', 'lastname', 'role', 'createdAt'],
        });

        return {
            tenant,
            school,
            adminUser,
        };
    }
}
