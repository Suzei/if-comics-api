import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto, { randomBytes } from 'node:crypto'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { env } from '../env'
import multer, { memoryStorage } from 'fastify-multer'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: env.REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.ACCESS_SECRET_KEY,
  },
})

const upload = multer({ storage: memoryStorage(), dest: 'uploads/' })
const generateFileName = (bytes = 32) => randomBytes(bytes).toString('hex')

export async function chapterRoutes(app: FastifyInstance) {
  async function UploadRequest(request: FastifyRequest) {
    const file = request.file
    const randomFileName = generateFileName()

    const uploadParams = {
      Bucket: env.BUCKET_NAME_PDF,
      Body: file.buffer,
      Key: randomFileName,
      ContentType: file?.mimetype,
    }
    await s3Client.send(new PutObjectCommand(uploadParams)).catch((err) => {
      console.log(err)
    })

    return {
      randomFileName,
    }
  }

  app.route({
    method: 'POST',
    url: '/',
    preHandler: upload.single('pdfFile'),
    handler: async function (request, reply) {
      const createChapterSchema = z.object({
        chapterTitle: z.string(),
        chapterNumber: z.string(),
        comicId: z.string(),
      })

      const { chapterNumber, chapterTitle, comicId } =
        createChapterSchema.parse(request.body)
      const fileName = (await UploadRequest(request)).randomFileName
      await knex('chapters').insert({
        id: crypto.randomUUID(),
        chapterFile: fileName,
        chapterNumber,
        chapterTitle,
        comicId,
      })
      return reply.status(201).send()
    },
  })

  async function getObjectSignedURL(key: string) {
    const params = {
      Bucket: env.BUCKET_NAME_IMAGES,
      Key: key,
    }

    const command = new GetObjectCommand(params)
    const seconds = 60
    const url = await getSignedUrl(s3Client, command, { expiresIn: seconds })

    return url
  }

  app.get('/:comicId', async (request) => {
    const getChapterByIdSchema = z.object({
      comicId: z.string(),
    })

    const { comicId } = getChapterByIdSchema.parse(request.params)
    const chapter = await knex('chapters').where('comicId', comicId)
    for (const chapters of chapter) {
      chapters.fileUrl = await getObjectSignedURL(chapters.chapterFile)
    }

    return { chapter }
  })

  function deleteFile(fileName) {
    const deleteParams = {
      Bucket: env.BUCKET_NAME_PDF,
      Key: fileName,
    }

    return s3Client.send(new DeleteObjectCommand(deleteParams))
  }

  app.delete('/:comicId/:id', async (request) => {
    const deleteChapterSchema = z.object({
      id: z.string().uuid(),
      comicId: z.string(),
    })

    const { comicId, id } = deleteChapterSchema.parse(request.params)
    const fileUrl = await knex('chapters').where({ id, comicId }).first()
    await deleteFile(fileUrl.chapterFile)
    await knex('chapters').delete().where({
      comicId,
      id,
    })
  })

  app.delete('/:comicId', async (request, reply) => {
    const deleteAllChapters = z.object({
      comicId: z.string(),
    })

    const { comicId } = deleteAllChapters.parse(request.params)
    const allFiles = await knex('chapters').where('comicId', comicId)

    allFiles.forEach((item) => {
      deleteFile(item.chapterFile)
    })
    await knex('chapters').delete().where('comic_id', comicId)
  })
}
