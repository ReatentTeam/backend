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

  await dataSource.query(`CREATE SCHEMA IF NOT EXISTS "tenant_${tenantDomain}"`);
  await dataSource.initialize();

  dataSourceMap.set(connectionName, dataSource);
  return dataSource;
}
