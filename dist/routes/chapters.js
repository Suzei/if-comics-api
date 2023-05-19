"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/chapters.ts
var chapters_exports = {};
__export(chapters_exports, {
  chapterRoutes: () => chapterRoutes
});
module.exports = __toCommonJS(chapters_exports);
var import_zod2 = require("zod");

// src/database.ts
var import_knex = require("knex");

// src/env/index.ts
var import_config = require("dotenv/config");
var import_zod = require("zod");
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["dev", "test", "production"]).default("production"),
  DATABASE_URL: import_zod.z.string(),
  // MIGRATIONS_DIR: z.string(),
  PORT: import_zod.z.coerce.number().default(3333),
  REGION: import_zod.z.string(),
  DATABASE_CLIENT: import_zod.z.enum(["sqlite", "pg"]),
  BUCKET_NAME_IMAGES: import_zod.z.string(),
  ACCESS_SECRET_KEY: import_zod.z.string(),
  ACCESS_KEY: import_zod.z.string(),
  BUCKET_NAME_PDF: import_zod.z.string()
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("WARNING: INVALID VARIABLES", _env.error.format());
  throw new Error("Invalid env variables.");
}
var env = _env.data;

// src/database.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL NOT FOUND");
}
var config = {
  client: env.DATABASE_CLIENT,
  // terá o sqlite como seu driver padrão
  connection: env.DATABASE_CLIENT === "sqlite" ? {
    filename: env.DATABASE_URL
  } : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations"
  }
};
var knex = (0, import_knex.knex)(config);

// src/routes/chapters.ts
var import_node_crypto = __toESM(require("crypto"));
var import_client_s3 = require("@aws-sdk/client-s3");
var import_fastify_multer = __toESM(require("fastify-multer"));
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var s3Client = new import_client_s3.S3Client({
  region: env.REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.ACCESS_SECRET_KEY
  }
});
var upload = (0, import_fastify_multer.default)({ storage: (0, import_fastify_multer.memoryStorage)(), dest: "uploads/" });
var generateFileName = (bytes = 32) => (0, import_node_crypto.randomBytes)(bytes).toString("hex");
async function chapterRoutes(app) {
  async function UploadRequest(request) {
    const file = request.file;
    const randomFileName = generateFileName();
    const uploadParams = {
      Bucket: env.BUCKET_NAME_PDF,
      Body: file.buffer,
      Key: randomFileName,
      ContentType: file?.mimetype
    };
    await s3Client.send(new import_client_s3.PutObjectCommand(uploadParams)).catch((err) => {
      console.log(err);
    });
    return {
      randomFileName
    };
  }
  app.route({
    method: "POST",
    url: "/",
    preHandler: upload.single("pdfFile"),
    handler: async function(request, reply) {
      const createChapterSchema = import_zod2.z.object({
        chapterTitle: import_zod2.z.string(),
        chapterNumber: import_zod2.z.string(),
        comicId: import_zod2.z.string()
      });
      const { chapterNumber, chapterTitle, comicId } = createChapterSchema.parse(request.body);
      const fileName = (await UploadRequest(request)).randomFileName;
      await knex("chapters").insert({
        id: import_node_crypto.default.randomUUID(),
        chapterFile: fileName,
        chapterNumber,
        chapterTitle,
        comicId
      });
      return reply.status(201).send();
    }
  });
  async function getObjectSignedURL(key) {
    const params = {
      Bucket: env.BUCKET_NAME_PDF,
      Key: key
    };
    const command = new import_client_s3.GetObjectCommand(params);
    const seconds = 60;
    const url = await (0, import_s3_request_presigner.getSignedUrl)(s3Client, command, { expiresIn: seconds });
    return url;
  }
  app.get("/:comicId", async (request) => {
    const getChapterByIdSchema = import_zod2.z.object({
      comicId: import_zod2.z.string()
    });
    const { comicId } = getChapterByIdSchema.parse(request.params);
    const chapter = await knex("chapters").where("comicId", comicId);
    for (const chapters of chapter) {
      chapters.fileUrl = await getObjectSignedURL(chapters.chapterFile);
    }
    return { chapter };
  });
  function deleteFile(fileName) {
    const deleteParams = {
      Bucket: env.BUCKET_NAME_PDF,
      Key: fileName
    };
    return s3Client.send(new import_client_s3.DeleteObjectCommand(deleteParams));
  }
  app.get("/chapter/:id", async (request, response) => {
    const getChapterByIdSchema = import_zod2.z.object({
      id: import_zod2.z.string()
    });
    const { id } = getChapterByIdSchema.parse(request.params);
    const chapter = await knex("chapters").where("id", id).first();
    chapter.fileUrl = await getObjectSignedURL(chapter?.chapterFile);
    return chapter;
  });
  app.delete("/:comicId/:id", async (request) => {
    const deleteChapterSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid(),
      comicId: import_zod2.z.string()
    });
    const { comicId, id } = deleteChapterSchema.parse(request.params);
    const fileUrl = await knex("chapters").where({ id, comicId }).first();
    await deleteFile(fileUrl.chapterFile);
    await knex("chapters").delete().where({
      comicId,
      id
    });
  });
  app.delete("/:comicId", async (request, reply) => {
    const deleteAllChapters = import_zod2.z.object({
      comicId: import_zod2.z.string()
    });
    const { comicId } = deleteAllChapters.parse(request.params);
    const allFiles = await knex("chapters").where("comicId", comicId);
    allFiles.forEach((item) => {
      deleteFile(item.chapterFile);
    });
    await knex("chapters").delete().where("comic_id", comicId);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chapterRoutes
});
