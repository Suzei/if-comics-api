import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto, { randomBytes } from 'node:crypto'
import { knex } from '../database'
import multer, { memoryStorage } from 'fastify-multer'
import { env } from '../env'
import {
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
      })

      const { author, description, title, user_id } = createComicSchema.parse(
        request.body,
      )

      const hasSameTitle = await knex('comics').where('title', title).first()

      if (hasSameTitle) {
        console.log('O título escolhido já existe em nossa plataforma.')
        throw new Error('Esse título já existe!')
      }

      let fileName

      if (comic_cover === null) {
        return
      } else {
        fileName = (await UploadRequest(request)).randomFileName
        UploadRequest(request)
      }

      await knex('comics').insert({
        id: crypto.randomUUID(),
        title,
        author,
        description,
        user_id,
        comic_cover: fileName,
      })

      // app.io.emit('success', (socket) => {
      //   console.log(socket, 'foi criado com sucesso!!')
      // })

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

    console.log(comics)

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

  app.delete('/:id', async (request) => {
    const deleteComicSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = deleteComicSchema.parse(request.params)

    await knex('comics').delete().where('id', id)
  })
}
