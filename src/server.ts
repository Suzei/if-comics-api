import Fastify from 'fastify'
import { env } from './env'
import { comicRoutes } from './routes/comics'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { chapterRoutes } from './routes/chapters'
import { loginRoutes } from './routes/login'
// import { reset } from './routes/reset'
import fastifyIO from 'fastify-socket.io'
import { S3ServiceRoute } from './routes/s3'

const app = Fastify()

app.register(fastifyIO)

app.register(cookie)
app.register(cors, {
  origin: '*',
})
app.register(require('@fastify/multipart'))
app.register(loginRoutes, { prefix: 'login' })
app.register(comicRoutes, { prefix: 'comics' })
app.register(chapterRoutes, { prefix: 'chapters' })
app.register(S3ServiceRoute)
// app.register(reset)

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
