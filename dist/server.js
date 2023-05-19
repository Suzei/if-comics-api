"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/server.ts
var import_fastify = __toESM(require("fastify"));

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

// src/routes/comics.ts
var import_zod2 = require("zod");
var import_node_crypto = __toESM(require("crypto"));

// src/database.ts
var import_knex = require("knex");
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
async function comicRoutes(app2) {
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
  app2.route({
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
  app2.get("/", async () => {
    const comics = await knex("comics").select("*");
    for (const comic of comics) {
      comic.imageUrl = await getObjectSignedURL(comic.comic_cover);
    }
    const transformingStringsToArray = Array.from(comics[6].genres.split(","));
    console.log(transformingStringsToArray);
    return { comics };
  });
  app2.get("/:id", async (request) => {
    const getComicByIDSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = getComicByIDSchema.parse(request.params);
    const comicById = await knex("comics").where("id", id).first();
    comicById.imageUrl = await getObjectSignedURL(comicById?.comic_cover);
    return { comicById };
  });
  app2.delete("/:id", async (request, reply) => {
    const deleteComicSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = deleteComicSchema.parse(request.params);
    const imageUrl = await knex("comics").where("id", id).first();
    await deleteFile(imageUrl.comic_cover);
    await knex("comics").delete().where("id", id);
  });
  app2.post("/:id/liked", async (request, reply) => {
    const LikeComicSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = LikeComicSchema.parse(request.params);
    const liked = await knex("comics").where("id", id).first();
    await knex("comics").where("id", id).first().update({
      likes: liked?.likes + 1
    });
  });
  app2.post("/:id/disliked", async (request, reply) => {
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

// src/server.ts
var import_cors = __toESM(require("@fastify/cors"));
var import_cookie = __toESM(require("@fastify/cookie"));

// src/routes/chapters.ts
var import_zod3 = require("zod");
var import_node_crypto2 = __toESM(require("crypto"));
var import_client_s32 = require("@aws-sdk/client-s3");
var import_fastify_multer2 = __toESM(require("fastify-multer"));
var import_s3_request_presigner2 = require("@aws-sdk/s3-request-presigner");
var s3Client2 = new import_client_s32.S3Client({
  region: env.REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.ACCESS_SECRET_KEY
  }
});
var upload2 = (0, import_fastify_multer2.default)({ storage: (0, import_fastify_multer2.memoryStorage)(), dest: "uploads/" });
var generateFileName2 = (bytes = 32) => (0, import_node_crypto2.randomBytes)(bytes).toString("hex");
async function chapterRoutes(app2) {
  async function UploadRequest(request) {
    const file = request.file;
    const randomFileName = generateFileName2();
    const uploadParams = {
      Bucket: env.BUCKET_NAME_PDF,
      Body: file.buffer,
      Key: randomFileName,
      ContentType: file?.mimetype
    };
    await s3Client2.send(new import_client_s32.PutObjectCommand(uploadParams)).catch((err) => {
      console.log(err);
    });
    return {
      randomFileName
    };
  }
  app2.route({
    method: "POST",
    url: "/",
    preHandler: upload2.single("pdfFile"),
    handler: async function(request, reply) {
      const createChapterSchema = import_zod3.z.object({
        chapterTitle: import_zod3.z.string(),
        chapterNumber: import_zod3.z.string(),
        comicId: import_zod3.z.string()
      });
      const { chapterNumber, chapterTitle, comicId } = createChapterSchema.parse(request.body);
      const fileName = (await UploadRequest(request)).randomFileName;
      await knex("chapters").insert({
        id: import_node_crypto2.default.randomUUID(),
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
    const command = new import_client_s32.GetObjectCommand(params);
    const seconds = 60;
    const url = await (0, import_s3_request_presigner2.getSignedUrl)(s3Client2, command, { expiresIn: seconds });
    return url;
  }
  app2.get("/:comicId", async (request) => {
    const getChapterByIdSchema = import_zod3.z.object({
      comicId: import_zod3.z.string()
    });
    const { comicId } = getChapterByIdSchema.parse(request.params);
    const chapter = await knex("chapters").where("comicId", comicId);
    for (const chapters of chapter) {
      chapters.fileUrl = await getObjectSignedURL(chapters.chapterFile);
    }
    return { chapter };
  });
  function deleteFile2(fileName) {
    const deleteParams = {
      Bucket: env.BUCKET_NAME_PDF,
      Key: fileName
    };
    return s3Client2.send(new import_client_s32.DeleteObjectCommand(deleteParams));
  }
  app2.get("/chapter/:id", async (request, response) => {
    const getChapterByIdSchema = import_zod3.z.object({
      id: import_zod3.z.string()
    });
    const { id } = getChapterByIdSchema.parse(request.params);
    const chapter = await knex("chapters").where("id", id).first();
    chapter.fileUrl = await getObjectSignedURL(chapter?.chapterFile);
    return chapter;
  });
  app2.delete("/:comicId/:id", async (request) => {
    const deleteChapterSchema = import_zod3.z.object({
      id: import_zod3.z.string().uuid(),
      comicId: import_zod3.z.string()
    });
    const { comicId, id } = deleteChapterSchema.parse(request.params);
    const fileUrl = await knex("chapters").where({ id, comicId }).first();
    await deleteFile2(fileUrl.chapterFile);
    await knex("chapters").delete().where({
      comicId,
      id
    });
  });
  app2.delete("/:comicId", async (request, reply) => {
    const deleteAllChapters = import_zod3.z.object({
      comicId: import_zod3.z.string()
    });
    const { comicId } = deleteAllChapters.parse(request.params);
    const allFiles = await knex("chapters").where("comicId", comicId);
    allFiles.forEach((item) => {
      deleteFile2(item.chapterFile);
    });
    await knex("chapters").delete().where("comic_id", comicId);
  });
}

// src/routes/login.ts
var import_zod4 = require("zod");
var jwt = __toESM(require("jsonwebtoken"));
var import_bcrypt = require("bcrypt");
var import_crypto = require("crypto");
async function loginRoutes(app2) {
  app2.post("/", async (request, reply) => {
    const logonSchema = import_zod4.z.object({
      username: import_zod4.z.string(),
      password: import_zod4.z.string()
    });
    const { password, username } = logonSchema.parse(request.body);
    const checkedPassword = await knex("users").where("username", username).first();
    const comparePassword = await (0, import_bcrypt.compare)(password, checkedPassword?.password);
    if (!comparePassword) {
      throw new Error("Senha e/ou email incorretos");
    }
    const jwtToken = jwt.sign({}, "9751ba99-8c01-4a8e-815a-782ffa83daba", {
      subject: checkedPassword?.id,
      expiresIn: 60 * 60
    });
    console.log("Sucedeu?");
    return { jwtToken };
  });
  app2.get("/", async (request, reply) => {
    const users = await knex("users").select("*");
    return users;
  });
  app2.post("/register", async (req, res) => {
    const createUserSchema = import_zod4.z.object({
      username: import_zod4.z.string(),
      email: import_zod4.z.string(),
      password: import_zod4.z.string()
    });
    const { email, password, username } = createUserSchema.parse(req.body);
    const hashPassword = await (0, import_bcrypt.hash)(password, 10);
    const userExists = await knex("users").where("username", username).first();
    const emailExists = await knex("users").where("email", email).first();
    if (userExists)
      throw new Error("Usu\xE1rio j\xE1 existe");
    if (emailExists)
      throw new Error("E-mail j\xE1 est\xE1 em uso.");
    await knex("users").insert({
      id: (0, import_crypto.randomUUID)(),
      email,
      password: hashPassword,
      username
    });
  });
}

// src/server.ts
var import_fastify_socket = __toESM(require("fastify-socket.io"));
var app = (0, import_fastify.default)();
app.register(import_fastify_socket.default);
app.register(import_cookie.default);
app.register(import_cors.default, {
  origin: "*"
});
app.register(require("@fastify/multipart"));
app.register(loginRoutes, { prefix: "login" });
app.register(comicRoutes, { prefix: "comics" });
app.register(chapterRoutes, { prefix: "chapters" });
app.ready().then(() => {
  app.io.on("connection", (socket) => {
    console.log("Funcionou?");
  });
});
app.listen({
  port: env.PORT
}).then(() => console.log(`Rodando na porta ${env.PORT} \u{1F680} `));
