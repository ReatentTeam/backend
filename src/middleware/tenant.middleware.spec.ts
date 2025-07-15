import { tenancyMiddleware } from './tenant.middleware';

describe('tenancyMiddleware', () => {
  it('should set tenantDomain when header provided', () => {
    const req: any = {
      headers: { 'x-tenant-id': 'acme' },
    };
    const res: any = {};
    const next = jest.fn();

    tenancyMiddleware(req as any, res as any, next);

    expect(req.tenantDomain).toBe('acme');
    expect(next).toHaveBeenCalled();
  });

  it('should set tenantDomain to null when header is missing', () => {
    const req: any = {
      headers: {},
    };
    const res: any = {};
    const next = jest.fn();

    tenancyMiddleware(req as any, res as any, next);

    expect(req.tenantDomain).toBeNull();
    expect(next).toHaveBeenCalled();
  });
}); 