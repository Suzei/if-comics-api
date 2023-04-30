import Fastify from 'fastify'
import { knex } from './database'
import { env } from './env'
import { comicRoutes } from './routes/comics'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { chapterRoutes } from './routes/chapters'
import { loginRoutes } from './routes/login'
import { reset } from './routes/reset'
const app = Fastify()

app.register(cors, {
  origin: '*',
})

app.register(cookie)

app.get('/test', async () => {
  const test = await knex('sqlite_schema').select('*')

  return test
})

app.register(loginRoutes, { prefix: 'login' })
app.register(comicRoutes, { prefix: 'comics' })
app.register(chapterRoutes, { prefix: 'chapters' })
app.register(reset)

app
  .listen({
    port: env.PORT,
  })
  .then(() => console.log(`Rodando na porta ${env.PORT} 🚀 `))
