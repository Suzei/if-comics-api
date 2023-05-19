import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto, { randomBytes } from 'node:crypto'
import { knex } from '../database'
import multer, { memoryStorage } from 'fastify-multer'
import { env } from '../env'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const upload = multer({ storage: memoryStorage(), dest: 'uploads/' })
const generateFileName = (bytes = 32) => randomBytes(bytes).toString('hex')

const s3Client = new S3Client({
  region: env.REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.ACCESS_SECRET_KEY,
  },
})

export function deleteFile(fileName) {
  const deleteParams = {
    Bucket: env.BUCKET_NAME_IMAGES,
    Key: fileName,
  }

  return s3Client.send(new DeleteObjectCommand(deleteParams))
}

export async function comicRoutes(app: FastifyInstance) {
  async function UploadRequest(request: FastifyRequest) {
    const file = request.file
    const fileToBuffer = await sharp(file.buffer).toBuffer()
    const randomFileName = generateFileName()

    const uploadParams = {
      Bucket: env.BUCKET_NAME_IMAGES,
      Body: fileToBuffer,
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
    preHandler: upload.single('image'),
    handler: async function (request: FastifyRequest, reply) {
      const createComicSchema = z.object({
        title: z.string(),
        author: z.string(),
        description: z.string(),
        user_id: z.string(),
        genres: z.string(),
      })

      const { author, description, title, user_id, genres } =
        createComicSchema.parse(request.body)
      const hasSameTitle = await knex('comics').where('title', title).first()

      if (hasSameTitle) {
        console.log('O título escolhido já existe em nossa plataforma.')
        throw new Error('Esse título já existe!')
      }

      const fileName = (await UploadRequest(request)).randomFileName

      await knex('comics').insert({
        id: crypto.randomUUID(),
        title,
        author,
        description,
        user_id,
        comic_cover: fileName,
        genres,
      })

      return reply.status(201).send({ message: 'Obra criada com sucesso!' })
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

  app.get('/', async () => {
    const comics = await knex('comics').select('*')
    for (const comic of comics) {
      comic.imageUrl = await getObjectSignedURL(comic.comic_cover)
    }
    return { comics }
  })

  app.get('/:id', async (request) => {
    const getComicByIDSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getComicByIDSchema.parse(request.params)
    const comicById = await knex('comics').where('id', id).first()

    comicById.imageUrl = await getObjectSignedURL(comicById?.comic_cover)

    return { comicById }
  })

  app.delete('/:id', async (request, reply) => {
    const deleteComicSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteComicSchema.parse(request.params)
    const imageUrl = await knex('comics').where('id', id).first()

    await deleteFile(imageUrl.comic_cover)
    await knex('comics').delete().where('id', id)
  })
  // LIKE SYSTEM
  app.post('/:id/liked', async (request, reply) => {
    const LikeComicSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = LikeComicSchema.parse(request.params)
    const liked = await knex('comics').where('id', id).first()
    await knex('comics')
      .where('id', id)
      .first()
      .update({
        likes: liked?.likes + 1,
      })
  })

  app.post('/:id/disliked', async (request, reply) => {
    const DislikeComicSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = DislikeComicSchema.parse(request.params)
    const liked = await knex('comics').where('id', id).first()
    await knex('comics')
      .where('id', id)
      .first()
      .update({
        likes: liked?.likes - 1,
      })
  })
}
