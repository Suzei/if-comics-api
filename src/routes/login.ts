// Nessa rota, precisa:

import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import * as jwt from 'jsonwebtoken'
import { compare, hash } from 'bcrypt'
import { randomUUID } from 'crypto'

// Criar um usuário

// Logar o usuário

// Ter autenticação nos campos de: email, login, senha, e token

// Rotas: POST e GET (Para autenticação )

export async function loginRoutes(app: FastifyInstance) {
  // Login do Usuário
  app.post('/', async (request, reply) => {
    const logonSchema = z.object({
      username: z.string(),
      password: z.string(),
    })

    const { password, username } = logonSchema.parse(request.body)

    const checkedPassword = await knex('users')
      .where('username', username)
      .first()
    const comparePassword = await compare(password, checkedPassword?.password)

    if (!comparePassword) {
      throw new Error('Senha e/ou email incorretos')
    }

    const jwtToken = jwt.sign({}, '9751ba99-8c01-4a8e-815a-782ffa83daba', {
      subject: checkedPassword?.id,
      expiresIn: 60 * 60,
    })

    console.log('Sucedeu?')

    return { jwtToken }
  })

  app.get('/', async (request, reply) => {
    const users = await knex('users').select('*')

    return users
  })

  // Criação de Login
  app.post('/register', async (req, res) => {
    const createUserSchema = z.object({
      username: z.string(),
      email: z.string(),
      password: z.string(),
    })

    const { email, password, username } = createUserSchema.parse(req.body)
    const hashPassword = await hash(password, 10)

    const userExists = await knex('users').where('username', username).first()
    const emailExists = await knex('users').where('email', email).first()

    if (userExists) throw new Error('Usuário já existe')
    if (emailExists) throw new Error('E-mail já está em uso.')

    await knex('users').insert({
      id: randomUUID(),
      email,
      password: hashPassword,
      username,
    })
  })
}
