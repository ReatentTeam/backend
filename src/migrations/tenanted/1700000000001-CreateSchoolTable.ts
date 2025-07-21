import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSchoolTable1700000000001 implements MigrationInterface {
    name = 'CreateSchoolTable1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "school",
                columns: [
                    {
                        name: "id",
                        type: "serial",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "address",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "country",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "state",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "phone",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "email",
                        type: "character varying",
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: "website",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "domain",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "schoolType",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "totalStudents",
                        type: "integer",
                        isNullable: false,
                    },
                    {
                        name: "totalTutors",
                        type: "integer",
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                        isNullable: false,
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                        isNullable: false,
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("school");
    }
} 