# Enhanced Multi-Tenant System

This document explains the enhanced multi-tenant system that automatically creates a school entity and admin user when a new tenant schema is created.

## 🏗️ System Overview

When a new tenant is created, the system automatically:

1. **Creates the Tenant** - Basic tenant information
2. **Creates Database Schema** - Isolated schema for tenant data
3. **Creates School Entity** - Comprehensive school information
4. **Creates Admin User** - Tenant administrator with OTP setup
5. **Sends Welcome Email** - Credentials and setup instructions

## 📋 Tenant Creation Process

### Basic Tenant Creation
```bash
POST /api/tenant
Content-Type: application/json

{
  "domain": "school1",
  "name": "School One",
  "firstname": "Admin",
  "lastname": "User", 
  "email": "admin@school1.com"
}
```

### Complete Tenant Creation with School Information
```bash
POST /api/tenant
Content-Type: application/json

{
  "domain": "school1",
  "name": "School One",
  "firstname": "Admin",
  "lastname": "User",
  "email": "admin@school1.com",
  
  // School Information
  "schoolName": "School One Academy",
  "schoolAddress": "123 Education Street, City, State",
  "country": "United States",
  "state": "California",
  "schoolType": "Secondary",
  "phone": "+1-555-0123",
  "website": "https://schoolone.com",
  "totalStudents": 500,
  "totalTutors": 25
}
```

## 🏛️ Database Entities

### Tenant Entity
```typescript
@Entity()
export class Tenant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ unique: true })
  name: string;
  
  @Column({ unique: true })
  domain: string;
}
```

### School Entity
```typescript
@Entity()
export class School {
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

  @Column({ unique: true })
  email: string;

  @Column()
  website: string;

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
```

### User Entity
```typescript
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
  domain: string;
  
  @Column()
  role: string;

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
```

## 🔐 Admin User Creation

### Automatic Admin User Setup
When a tenant is created, the system automatically:

1. **Generates Secure Password** - 12-character password with complexity requirements
2. **Creates OTP Secret** - Encrypted OTP secret for two-factor authentication
3. **Sets Role** - Assigns `Tenant_Admin` role
4. **Sends Welcome Email** - Includes login credentials and setup instructions

### Admin User Properties
- **Role**: `Tenant_Admin`
- **Permissions**: Full access to tenant management
- **Authentication**: Email/password + OTP verification
- **Email**: Welcome email with credentials

## 📧 Email Notifications

### Welcome Email Template
The system sends a welcome email to the admin user containing:
- Login credentials (email and generated password)
- School information
- Setup instructions
- Support contact information

## 🛡️ Security Features

### Password Generation
- **Length**: 12 characters
- **Complexity**: Uppercase, lowercase, numbers, special characters
- **Randomization**: Secure random generation
- **Storage**: Bcrypt hashed with 10 salt rounds

### OTP Setup
- **Secret Generation**: Base32 encoded secret
- **Encryption**: AES-256-CTR encryption
- **Key Management**: Unique key per user
- **Storage**: Encrypted in database

## 📡 API Endpoints

### Tenant Management
- `POST /api/tenant` - Create new tenant with school and admin
- `GET /api/tenant` - Get all tenants
- `GET /api/tenant/:domain` - Get tenant by domain
- `GET /api/tenant/details/:domain` - Get tenant with school and admin details

### School Management
- `GET /api/school/info` - Get school information (authenticated)
- `POST /api/school/onboarding` - Create school during onboarding
- `PUT /api/school/update` - Update school information (admin only)
- `GET /api/school/stats` - Get school statistics (admin only)
- `DELETE /api/school` - Delete school (admin only)

### User Management
- `POST /api/user/auth/register` - Register new user
- `POST /api/user/auth/login` - Login with credentials
- `POST /api/user/auth/verify-otp` - Verify OTP
- `GET /api/user/profile` - Get user profile
- `GET /api/user/users` - Get all users (admin only)
- `POST /api/user/users` - Create user (admin only)
- `PUT /api/user/users/:id/role` - Update user role (admin only)
- `DELETE /api/user/users/:id` - Delete user (admin only)

## 🔄 Onboarding Flow

### Step 1: Tenant Creation
1. Submit tenant creation request with school information
2. System creates tenant, school, and admin user
3. Welcome email sent to admin

### Step 2: Admin Login
1. Admin receives welcome email with credentials
2. Login with email and generated password
3. Complete OTP verification
4. Access tenant dashboard

### Step 3: School Setup
1. Admin can update school information
2. Add teachers and students
3. Configure classes and assignments
4. Complete onboarding process

## 📊 Response Examples

### Successful Tenant Creation
```json
{
  "tenant": {
    "id": 1,
    "name": "School One",
    "domain": "school1",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "school": {
    "id": 1,
    "name": "School One Academy",
    "address": "123 Education Street, City, State",
    "country": "United States",
    "state": "California",
    "phone": "+1-555-0123",
    "email": "admin@school1.com",
    "website": "https://schoolone.com",
    "domain": "school1",
    "schoolType": "Secondary",
    "totalStudents": 500,
    "totalTutors": 25,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "adminUser": {
    "id": 1,
    "email": "admin@school1.com",
    "firstname": "Admin",
    "lastname": "User",
    "role": "Tenant_Admin"
  },
  "message": "Tenant created successfully with school and admin user"
}
```

### Tenant Details Response
```json
{
  "tenant": {
    "id": 1,
    "name": "School One",
    "domain": "school1",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "school": {
    "id": 1,
    "name": "School One Academy",
    "address": "123 Education Street, City, State",
    "country": "United States",
    "state": "California",
    "phone": "+1-555-0123",
    "email": "admin@school1.com",
    "website": "https://schoolone.com",
    "domain": "school1",
    "schoolType": "Secondary",
    "totalStudents": 500,
    "totalTutors": 25,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "adminUser": {
    "id": 1,
    "email": "admin@school1.com",
    "firstname": "Admin",
    "lastname": "User",
    "role": "Tenant_Admin",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## 🧪 Testing

### Test Tenant Creation
```bash
# Basic tenant creation
curl -X POST http://localhost:3000/api/tenant \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "testschool",
    "name": "Test School",
    "firstname": "Test",
    "lastname": "Admin",
    "email": "admin@testschool.com"
  }'

# Complete tenant creation with school info
curl -X POST http://localhost:3000/api/tenant \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "testschool2",
    "name": "Test School 2",
    "firstname": "Test",
    "lastname": "Admin",
    "email": "admin@testschool2.com",
    "schoolName": "Test School Academy",
    "schoolAddress": "456 Test Street, Test City, TS",
    "country": "United States",
    "state": "Test State",
    "schoolType": "Primary",
    "phone": "+1-555-9999",
    "website": "https://testschool2.com",
    "totalStudents": 200,
    "totalTutors": 15
  }'
```

### Test Tenant Details
```bash
curl -X GET http://localhost:3000/api/tenant/details/testschool
```

### Test School Management
```bash
# Get school info (requires authentication)
curl -X GET http://localhost:3000/api/school/info \
  -H "Authorization: Bearer {token}" \
  -H "x-tenant-id: testschool"

# Update school info (admin only)
curl -X PUT http://localhost:3000/api/school/update \
  -H "Authorization: Bearer {token}" \
  -H "x-tenant-id: testschool" \
  -H "Content-Type: application/json" \
  -d '{
    "totalStudents": 600,
    "totalTutors": 30
  }'
```

## 📝 Notes

- **Schema Isolation**: Each tenant gets its own database schema
- **Data Security**: Tenant data is completely isolated
- **Admin Setup**: Admin users are created with full OTP authentication
- **Email Notifications**: Welcome emails are sent automatically
- **Flexible Creation**: Can create tenant with or without school information
- **Comprehensive Data**: School entity stores all onboarding form data
- **Role-Based Access**: Admin users have `Tenant_Admin` role with full permissions
- **Multi-Tenant Architecture**: Complete data separation between tenants
- **Automatic Setup**: School and admin user are created automatically
- **Secure Authentication**: OTP-based two-factor authentication for admin users 