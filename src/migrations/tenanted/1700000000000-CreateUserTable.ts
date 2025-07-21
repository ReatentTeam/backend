import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserTable1700000000000 implements MigrationInterface {
    name = 'CreateUserTable1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user",
                columns: [
                    {
                        name: "id",
                        type: "serial",
                        isPrimary: true,
                    },
                    {
                        name: "firstname",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "lastname",
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
                        name: "password",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "domain",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "role",
                        type: "character varying",
                        isNullable: false,
                    },
                    {
                        name: "otp_secret",
                        type: "bytea",
                        isNullable: true,
                    },
                    {
                        name: "otp_details",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "user_key",
                        type: "character varying",
                        isNullable: true,
                    },
                    {
                        name: "last_login",
                        type: "timestamp",
                        isNullable: true,
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
        await queryRunner.dropTable("user");
    }
} 