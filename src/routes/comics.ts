import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { knex } from '../database'

export async function comicRoutes(app: FastifyInstance) {
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const createComicSchema = z.object({
      title: z.string(),
      author: z.string(),
      description: z.string(),
    })

    const { author, description, title } = createComicSchema.parse(request.body)

    await knex('comics').insert({
      id: crypto.randomUUID(),
      title,
      author,
      description,
    })

    return reply.status(201).send()
  })

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
}
