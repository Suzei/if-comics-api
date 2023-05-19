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

// src/routes/comics.ts
var comics_exports = {};
__export(comics_exports, {
  comicRoutes: () => comicRoutes,
  deleteFile: () => deleteFile
});
module.exports = __toCommonJS(comics_exports);
var import_zod2 = require("zod");
var import_node_crypto = __toESM(require("crypto"));

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

// src/routes/comics.ts
var import_fastify_multer = __toESM(require("fastify-multer"));
var import_client_s3 = require("@aws-sdk/client-s3");
var import_sharp = __toESM(require("sharp"));
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var upload = (0, import_fastify_multer.default)({ storage: (0, import_fastify_multer.memoryStorage)(), dest: "uploads/" });
var generateFileName = (bytes = 32) => (0, import_node_crypto.randomBytes)(bytes).toString("hex");
var s3Client = new import_client_s3.S3Client({
  region: env.REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.ACCESS_SECRET_KEY
  }
});
function deleteFile(fileName) {
  const deleteParams = {
    Bucket: env.BUCKET_NAME_IMAGES,
    Key: fileName
  };
  return s3Client.send(new import_client_s3.DeleteObjectCommand(deleteParams));
}
async function comicRoutes(app) {
  async function UploadRequest(request) {
    const file = request.file;
    const fileToBuffer = await (0, import_sharp.default)(file.buffer).toBuffer();
    const randomFileName = generateFileName();
    const uploadParams = {
      Bucket: env.BUCKET_NAME_IMAGES,
      Body: fileToBuffer,
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
    preHandler: upload.single("image"),
    handler: async function(request, reply) {
      const createComicSchema = import_zod2.z.object({
        title: import_zod2.z.string(),
        author: import_zod2.z.string(),
        description: import_zod2.z.string(),
        user_id: import_zod2.z.string(),
        genres: import_zod2.z.string()
      });
      const { author, description, title, user_id, genres } = createComicSchema.parse(request.body);
      const hasSameTitle = await knex("comics").where("title", title).first();
      if (hasSameTitle) {
        console.log("O t\xEDtulo escolhido j\xE1 existe em nossa plataforma.");
        throw new Error("Esse t\xEDtulo j\xE1 existe!");
      }
      const fileName = (await UploadRequest(request)).randomFileName;
      await knex("comics").insert({
        id: import_node_crypto.default.randomUUID(),
        title,
        author,
        description,
        user_id,
        comic_cover: fileName,
        genres
      });
      return reply.status(201).send({ message: "Obra criada com sucesso!" });
    }
  });
  async function getObjectSignedURL(key) {
    const params = {
      Bucket: env.BUCKET_NAME_IMAGES,
      Key: key
    };
    const command = new import_client_s3.GetObjectCommand(params);
    const seconds = 60;
    const url = await (0, import_s3_request_presigner.getSignedUrl)(s3Client, command, { expiresIn: seconds });
    return url;
  }
  app.get("/", async () => {
    const comics = await knex("comics").select("*");
    for (const comic of comics) {
      comic.imageUrl = await getObjectSignedURL(comic.comic_cover);
    }
    const transformingStringsToArray = Array.from(comics[6].genres.split(","));
    console.log(transformingStringsToArray);
    return { comics };
  });
  app.get("/:id", async (request) => {
    const getComicByIDSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = getComicByIDSchema.parse(request.params);
    const comicById = await knex("comics").where("id", id).first();
    comicById.imageUrl = await getObjectSignedURL(comicById?.comic_cover);
    return { comicById };
  });
  app.delete("/:id", async (request, reply) => {
    const deleteComicSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = deleteComicSchema.parse(request.params);
    const imageUrl = await knex("comics").where("id", id).first();
    await deleteFile(imageUrl.comic_cover);
    await knex("comics").delete().where("id", id);
  });
  app.post("/:id/liked", async (request, reply) => {
    const LikeComicSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = LikeComicSchema.parse(request.params);
    const liked = await knex("comics").where("id", id).first();
    await knex("comics").where("id", id).first().update({
      likes: liked?.likes + 1
    });
  });
  app.post("/:id/disliked", async (request, reply) => {
    const DislikeComicSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = DislikeComicSchema.parse(request.params);
    const liked = await knex("comics").where("id", id).first();
    await knex("comics").where("id", id).first().update({
      likes: liked?.likes - 1
    });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  comicRoutes,
  deleteFile
});
