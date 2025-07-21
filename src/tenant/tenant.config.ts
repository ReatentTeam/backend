import tenantConfig from 'src/tenant.orm.config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const dataSourceMap: Map<string, DataSource> = new Map();

export async function getTenantConnection(tenantDomain: string): Promise<DataSource> {
  const connectionName = `tenant_${tenantDomain}`;

  if (dataSourceMap.has(connectionName)) {
    const dataSource = dataSourceMap.get(connectionName)!;
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    return dataSource;
  }

  const options: DataSourceOptions = {
    ...(tenantConfig as PostgresConnectionOptions), // ✅ force type
    name: connectionName,
    schema: `tenant_${tenantDomain}`, // ✅ PostgreSQL-specific
  };

  const dataSource = new DataSource(options);

  // Initialize the connection first
  await dataSource.initialize();
  
  // Create schema if it doesn't exist (after initialization)
  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "tenant_${tenantDomain}";`);
  
  // Set the search path to the tenant schema
  await dataSource.query(`SET search_path TO "tenant_${tenantDomain}";`);

  dataSourceMap.set(connectionName, dataSource);
  return dataSource;
}

// Utility function to execute queries in tenant schema
export async function executeInTenantSchema<T>(
  tenantDomain: string, 
  query: string, 
  params: any[] = []
): Promise<T[]> {
  const schema = `tenant_${tenantDomain}`;
  const connection = await getTenantConnection(tenantDomain);
  
  // Set the search path to the tenant schema
  await connection.query(`SET search_path TO "${schema}";`);
  
  return await connection.query(query, params);
}

// Function to close all tenant connections (useful for cleanup)
export async function closeAllTenantConnections(): Promise<void> {
  for (const [name, dataSource] of dataSourceMap.entries()) {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
  dataSourceMap.clear();
}
