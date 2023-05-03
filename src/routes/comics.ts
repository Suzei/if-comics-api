import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { knex } from '../database'
import { isAuthenticated } from '../middlewares/checkJWT'

export async function comicRoutes(app: FastifyInstance) {
  app.post(
    '/',
    // { preHandler: [isAuthenticated] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const createComicSchema = z.object({
        title: z.string(),
        author: z.string(),
        description: z.string(),
        user_id: z.string(),
      })

      const { author, description, title, user_id } = createComicSchema.parse(
        request.body,
      )

      const hasSameTitle = await knex('comics').where('title', title).first()

      if (hasSameTitle) {
        throw new Error('Esse título já existe!')
      }

      await knex('comics').insert({
        id: crypto.randomUUID(),
        title,
        author,
        description,
        user_id,
      })

      return reply.status(201).send()
    },
  )

  app.get('/', async () => {
    const comics = await knex('comics').select('*')

    return { comics }
  })

  app.get('/:id', async (request) => {
    const getComicByIDSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getComicByIDSchema.parse(request.params)
    const comicById = await knex('comics').where('id', id).first()

    return { comicById }
  })

  app.delete('/:id', async (request) => {
    const deleteComicSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteComicSchema.parse(request.params)

    await knex('comics').delete().where('id', id)
  })
}
