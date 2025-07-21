import { NextFunction, Request, Response } from 'express';

// Extend Express Request interface to include tenantId
declare module 'express-serve-static-core' {
  interface Request {
    tenantDomain?: string | null;
  }
}

const TENANT_HEADER = 'x-tenant-id';

// Routes that don't require tenant context
const NON_TENANT_ROUTES = [
  '/api/auth', // Super admin auth routes
  '/api/super-admin', // Super admin routes
  '/api/tenant', // Tenant management routes (these are super admin routes for managing tenants)
];

export function tenancyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Check if the current route should skip tenant middleware
  const shouldSkipTenantMiddleware = NON_TENANT_ROUTES.some(route => 
    req.path.startsWith(route)
  );

  if (shouldSkipTenantMiddleware) {
    // For non-tenant routes, set tenantDomain to null and continue
    req.tenantDomain = null;
    return next();
  }

  // For tenant routes, extract tenant domain from header
  const header = req.headers[TENANT_HEADER] as string;
  req.tenantDomain = header?.toString() || null;
  
  // For tenant routes, validate that tenant domain is provided
  if (!req.tenantDomain) {
    console.warn(`[Tenant Middleware] Route ${req.path} accessed without tenant domain`);
    // Don't throw error here, let the individual controllers handle missing tenant domain
  }
  
  next();
}