import Fastify from 'fastify'
import { env } from './env'
import { comicRoutes } from './routes/comics'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { chapterRoutes } from './routes/chapters'
import { loginRoutes } from './routes/login'
import fastifyIO from 'fastify-socket.io'

const app = Fastify()
app.register(cors, {
  origin: (origin, cb) => {
    const hostname = new URL(origin).hostname

    if (hostname === 'localhost') {
      cb(null, true)
    }
  },
})

app.register(fastifyIO)

app.register(cookie)

app.register(require('@fastify/multipart'))
app.register(loginRoutes, { prefix: 'login' })
app.register(comicRoutes, { prefix: 'comics' })
app.register(chapterRoutes, { prefix: 'chapters' })

app.ready().then(() => {
  app.io.on('connection', (socket) => {
    console.log('Funcionou?')
  })
})
app
  .listen({
    port: env.PORT,
  })
  .then(() => console.log(`Rodando na porta ${env.PORT} 🚀 `))
