import { NextFunction, Request, Response } from 'express';

// Extend Express Request interface to include tenantId
declare module 'express-serve-static-core' {
  interface Request {
    tenantDomain?: string | null;
  }
}

const TENANT_HEADER = 'x-tenant-id'

export function tenancyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers[TENANT_HEADER] as string;
  req.tenantDomain = header?.toString() || null;
  next();
}