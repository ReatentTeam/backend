
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity({ name: 'super_admin' })
export class SuperAdminEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    email: string;

    @Column({ nullable: false })
    password: string;

    @Column({nullable: false})
    firstName: string;

    @Column({ nullable: false })
    lastName: string;

    @Column({ default: true })
    isActive: boolean;

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



}