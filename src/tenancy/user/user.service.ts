import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entity/User.entity";
import { UserDto } from "./dto/user.dto";
import * as bcrypt from "bcrypt";
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Role } from "./roles/role.enum";

@Injectable()
export  class UserService {
    private readonly userRepository: Repository<User>;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {
        this.userRepository = userRepo;
    }

    async createUser(dto: UserDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new Error("User already exists with this email");
        }
        // Hash the password before saving
        const saltRounds = 10;
        const password = await bcrypt.hash(dto.password, saltRounds);
        const user = this.userRepository.create({...dto, password:password});
        return await this.userRepository.save(user);
    }

    async findAllUsers(domain: string): Promise<User[]> {
        return await this.userRepository.find({
            where: { domain },
            select: ['id', 'firstname', 'lastname', 'email', 'role', 'createdAt', 'last_login'],
        });
    }

    async findUserById(id: number, domain: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id, domain },
            select: ['id', 'firstname', 'lastname', 'email', 'role', 'createdAt', 'last_login'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findUsersByRole(role: Role, domain: string): Promise<User[]> {
        return await this.userRepository.find({
            where: { role, domain },
            select: ['id', 'firstname', 'lastname', 'email', 'role', 'createdAt'],
        });
    }

    async findUserByEmail(email: string, domain: string): Promise<User | undefined> {
        return await this.userRepository.findOne({ 
            where: { email, domain },
            select: ['id', 'firstname', 'lastname', 'email', 'role', 'password', 'otp_secret', 'user_key', 'otp_details'],
        });
    }

    async updateUser(id: number, updateData: Partial<User>, domain: string): Promise<User> {
        const user = await this.findUserById(id, domain);
        
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        }

        await this.userRepository.update({ id, domain }, updateData);
        return await this.findUserById(id, domain);
    }

    async deleteUser(id: number, domain: string): Promise<void> {
        const user = await this.findUserById(id, domain);
        await this.userRepository.remove(user);
    }

    async updateUserRole(id: number, newRole: Role, domain: string): Promise<User> {
        const user = await this.findUserById(id, domain);
        user.role = newRole;
        return await this.userRepository.save(user);
    }

    async getUsersByDomain(domain: string): Promise<User[]> {
        return await this.userRepository.find({
            where: { domain },
            select: ['id', 'firstname', 'lastname', 'email', 'role', 'createdAt'],
        });
    }

    async getUserStats(domain: string): Promise<{ total: number; byRole: Record<string, number> }> {
        const users = await this.findAllUsers(domain);
        const byRole = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: users.length,
            byRole,
        };
    }
}