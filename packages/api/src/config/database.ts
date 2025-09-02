import knex from 'knex';
import type { Knex } from 'knex';
import config from '../../knexfile.js';
import * as dotenv from 'dotenv';

dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const knexConfig = config[environment];

export const db: Knex = knex(knexConfig);

export interface DatabaseConfig {
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  pool: {
    min: number;
    max: number;
  };
}

export function getDbConfig(): DatabaseConfig {
  return {
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'multi_tenant_crm',
    },
    pool: {
      min: 2,
      max: 10
    }
  };
}

export default db;