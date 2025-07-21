import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../../base.entity";

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstname: string;
    
    @Column()
    lastname: string;
    
    @Column({ unique: true })
    email: string;
    
    @Column()
    password: string;
    
    @Column()
    domain: string; // This is the tenant's domain
    
    @Column()
    role: string; // Default role for tenant users

    @Column({ type: "bytea", default: null })
    otp_secret: Buffer;
    
    @Column({ type: "jsonb", default: null })
    otp_details: {
        otp: string;
        timeIssued: number;
        expiry: Date;
    };

    @Column({ type: String, default: null })
    user_key: string;

    @Column({ type: 'timestamp', nullable: true })
    last_login: Date;
}