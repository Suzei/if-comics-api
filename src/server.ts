import Fastify from 'fastify'
import { knex } from './database'
import { env } from './env'
import { comicRoutes } from './routes/comics'
import cors from '@fastify/cors'
const app = Fastify()

app.register(cors, {
  origin: '*',
})

app.get('/test', async () => {
  const test = await knex('sqlite_schema').select('*')

  return test
})

app.register(comicRoutes, { prefix: 'comics' })

app
  .listen({
    port: env.PORT,
  })
  .then(() => console.log('HTTP server running!'))
