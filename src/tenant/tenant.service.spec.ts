import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { Tenant } from './tenant.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantDto } from './tenant.dto';

// Mocks
const mockRunMigrations = jest.fn();
const mockDestroy = jest.fn();
const mockGetTenantConnection = jest.fn().mockResolvedValue({
  runMigrations: mockRunMigrations,
  destroy: mockDestroy,
});

jest.mock('./tenant.config', () => ({
  getTenantConnection: (...args: any[]) => mockGetTenantConnection(...args),
}));

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: Partial<Repository<Tenant>>;

  beforeEach(async () => {
    tenantRepository = {
      create: jest.fn((dto: TenantDto) => ({ id: 1, ...dto } as Tenant)),
      save: jest.fn(async (entity: Tenant) => entity),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      manager: {
        query: jest.fn(),
      },
    } as unknown as Partial<Repository<Tenant>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: tenantRepository,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTenant', () => {
    it('should create tenant, create schema, run migrations and destroy connection', async () => {
      const dto: TenantDto = { name: 'Acme', domain: 'acme' } as TenantDto;

      const result = await service.createTenant(dto);

      // repository interactions
      expect(tenantRepository.create).toHaveBeenCalledWith(dto);
      expect(tenantRepository.save).toHaveBeenCalled();
      expect((tenantRepository.manager as any).query).toHaveBeenCalledWith(
        'CREATE SCHEMA IF NOT EXISTS "tenant_acme";'
      );

      // getTenantConnection called correctly
      expect(mockGetTenantConnection).toHaveBeenCalledWith('acme');
      expect(mockRunMigrations).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();

      expect(result).toEqual({ id: 1, ...dto });
    });
  });
}); 