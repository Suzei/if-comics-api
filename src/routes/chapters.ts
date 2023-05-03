import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto from 'node:crypto'
import { isAuthenticated } from '../middlewares/checkJWT'

export async function chapterRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createChapterSchema = z.object({
      chapterTitle: z.string(),
      chapterNumber: z.string(),
      chapterFile: z.string(),
      comicId: z.string(),
    })

    const { chapterFile, chapterNumber, chapterTitle, comicId } =
      createChapterSchema.parse(request.body)

    await knex('chapters').insert({
      id: crypto.randomUUID(),
      chapterFile,
      chapterNumber,
      chapterTitle,
      comicId,
    })

    console.log(comicId)

    return reply.status(201).send()
  })

  app.get('/:comicId', async (request) => {
    const getChapterByIdSchema = z.object({
      comicId: z.string(),
    })

    const { comicId } = getChapterByIdSchema.parse(request.params)
    const chapterById = await knex('chapters')
      .select('*')
      .where('comicId', comicId)
    return { chapterById }
  })

  app.delete('/:comicId/:id', async (request) => {
    const deleteChapterSchema = z.object({
      id: z.string().uuid(),
      comicId: z.string(),
    })

    const { comicId, id } = deleteChapterSchema.parse(request.params)

    await knex('chapters').delete().where('comic_id', comicId).where('id', id)
  })
}
