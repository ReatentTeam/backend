import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().min(1, "DB_USERNAME is required"),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  NODEMAILER_EMAIL: z.email("NODEMAILER_EMAIL is required"),
  NODEMAILER_PASSWORD: z.string().min(1, "NODEMAILER_PASSWORD is required"),
  NODEMAILER_PORT: z.coerce.number().default(587),
  DB_DATABASE: z.string().min(1, "DB_DATABASE is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Invalid environment configuration:");
  parseResult.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

const env = parseResult.data;

export default registerAs('config', () => ({
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  mailer: {
    email: env.NODEMAILER_EMAIL,
    password: env.NODEMAILER_PASSWORD,
    port: env.NODEMAILER_PORT,
  },
  db:{
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
  },
  jwt:{
    secret: env.JWT_SECRET
  },
//   appPassword: process.env.APP_PASSWORD,
}));