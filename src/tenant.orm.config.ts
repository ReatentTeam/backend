import { DataSourceOptions } from 'typeorm';

import { join } from 'path';
import ormConfig from './orm.config';

const tenantConfig: DataSourceOptions = {
  ...ormConfig,
  entities: [join(__dirname, './**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/tenanted/*{.ts,.js}')],
};

export default tenantConfig;