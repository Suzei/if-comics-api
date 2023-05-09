import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '../env'
import multer from 'fastify-multer'
import { randomBytes } from 'crypto'
import { FastifyRequest } from 'fastify'

const generateFileName = (bytes = 32) => randomBytes(bytes).toString('hex')

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

export async function PostImageToS3(image: FastifyRequest) {
  const randomFileName = generateFileName()
  const file = image.file
  const uploadParams = {
    Bucket: bucketName,
    Body: file?.buffer,
    Key: randomFileName,
    ContentType: file.mimetype,
  }

  console.log(image)

  await s3Client.send(new PutObjectCommand(uploadParams))
}
