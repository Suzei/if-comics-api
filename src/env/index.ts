import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('production'),
  DATABASE_URL: z.string(),
  MIGRATIONS_DIR: z.string(),
  PORT: z.number().default(3333),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error('WARNING: INVALID VARIABLES', _env.error.format())

  throw new Error('Invalid env variables.')
}

export const env = _env.data
