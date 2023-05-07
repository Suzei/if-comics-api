import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { knex } from '../database'
import multer, { memoryStorage } from 'fastify-multer'
import { PostImageToS3 } from '../aws/PostImageToS3'

export async function comicRoutes(app: FastifyInstance) {
  const upload = multer({ storage: memoryStorage() }).single('image')

  app.post(
    '/',
    { preHandler: [upload] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const createComicSchema = z.object({
        title: z.string(),
        author: z.string(),
        description: z.string(),
        user_id: z.string(),
        comic_cover: z.string(),
      })

      const imageName = PostImageToS3(request.file)

      const { author, description, title, user_id, comic_cover } =
        createComicSchema.parse(request.body)

      const hasSameTitle = await knex('comics').where('title', title).first()

      if (hasSameTitle) {
        throw new Error('Esse título já existe!')
      }

      await knex('comics').insert({
        id: crypto.randomUUID(),
        title,
        author,
        description,
        comic_cover: imageName,
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
