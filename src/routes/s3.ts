import { FastifyInstance } from 'fastify'
import multer from 'fastify-multer'
import { env } from '../env'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomBytes } from 'crypto'

const bucketName = env.BUCKET_NAME_IMAGES
const region = env.REGION
const accessId = env.ACCESS_KEY
const secretKey = env.ACCESS_SECRET_KEY

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessId,
    secretAccessKey: secretKey,
  },
})

const generateFileName = (bytes = 32) => randomBytes(bytes).toString('hex')

export const S3ServiceRoute = async (app: FastifyInstance) => {
  // app.route({
  //   method: 'POST',
  //   url: '/test',
  //   preHandler: upload.single('image'),
  //   handler: async function (request, reply) {
  //     const randomFileName = generateFileName()
  //     const file = request.file
  //     const uploadParams = {
  //       Bucket: bucketName,
  //       Body: file?.buffer,
  //       Key: randomFileName,
  //       ContentType: file.mimetype,
  //     }
  //     await s3Client.send(new PutObjectCommand(uploadParams))
  //   },
  // })
  // app.route({
  //   method: 'GET',
  //   url: '/test',
  //   handler: async function (request, reply) {},
  // })
}
