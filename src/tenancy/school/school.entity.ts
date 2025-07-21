import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class School{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column()
    country: string;

    @Column()
    state: string;

    @Column()
    phone: string;

    @Column({unique: true})
    email: string;

    @Column()
    website: string;

    // @Column()
    // logo: string;

    @Column()
    domain: string;

    @Column()
    schoolType: string;

    @Column()
    totalStudents: number;

    @Column()
    totalTutors: number;

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}