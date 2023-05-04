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
  MIGRATIONS_DIR: import_zod.z.string(),
  PORT: import_zod.z.number().default(3333)
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
  client: "sqlite",
  // terá o sqlite como seu driver padrão
  connection: {
    filename: env.DATABASE_URL
    // e que quando conectar, criará um arquivo que vai ter os dados do banco localmente.
  },
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: env.MIGRATIONS_DIR
  }
};
var knex = (0, import_knex.knex)(config);

// src/routes/comics.ts
async function comicRoutes(app2) {
  app2.post(
    "/",
    // { preHandler: [isAuthenticated] },
    async (request, reply) => {
      const createComicSchema = import_zod2.z.object({
        title: import_zod2.z.string(),
        author: import_zod2.z.string(),
        description: import_zod2.z.string(),
        user_id: import_zod2.z.string()
      });
      const { author, description, title, user_id } = createComicSchema.parse(
        request.body
      );
      const hasSameTitle = await knex("comics").where("title", title).first();
      if (hasSameTitle) {
        throw new Error("Esse t\xEDtulo j\xE1 existe!");
      }
      await knex("comics").insert({
        id: import_node_crypto.default.randomUUID(),
        title,
        author,
        description,
        user_id
      });
      return reply.status(201).send();
    }
  );
  app2.get("/", async () => {
    const comics = await knex("comics").select("*");
    return { comics };
  });
  app2.get("/:id", async (request) => {
    const getComicByIDSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = getComicByIDSchema.parse(request.params);
    const comicById = await knex("comics").where("id", id).first();
    return { comicById };
  });
  app2.delete("/:id", async (request) => {
    const deleteComicSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid()
    });
    const { id } = deleteComicSchema.parse(request.params);
    await knex("comics").delete().where("id", id);
  });
}

// src/server.ts
var import_cors = __toESM(require("@fastify/cors"));
var import_cookie = __toESM(require("@fastify/cookie"));

// src/routes/chapters.ts
var import_zod3 = require("zod");
var import_node_crypto2 = __toESM(require("crypto"));
async function chapterRoutes(app2) {
  app2.post("/", async (request, reply) => {
    const createChapterSchema = import_zod3.z.object({
      chapterTitle: import_zod3.z.string(),
      chapterNumber: import_zod3.z.string(),
      chapterFile: import_zod3.z.string(),
      comicId: import_zod3.z.string()
    });
    const { chapterFile, chapterNumber, chapterTitle, comicId } = createChapterSchema.parse(request.body);
    await knex("chapters").insert({
      id: import_node_crypto2.default.randomUUID(),
      chapterFile,
      chapterNumber,
      chapterTitle,
      comicId
    });
    console.log(comicId);
    return reply.status(201).send();
  });
  app2.get("/:comicId", async (request) => {
    const getChapterByIdSchema = import_zod3.z.object({
      comicId: import_zod3.z.string()
    });
    const { comicId } = getChapterByIdSchema.parse(request.params);
    const chapterById = await knex("chapters").select("*").where("comicId", comicId);
    return { chapterById };
  });
  app2.delete("/:comicId/:id", async (request) => {
    const deleteChapterSchema = import_zod3.z.object({
      id: import_zod3.z.string().uuid(),
      comicId: import_zod3.z.string()
    });
    const { comicId, id } = deleteChapterSchema.parse(request.params);
    await knex("chapters").delete().where("comic_id", comicId).where("id", id);
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

// src/routes/reset.ts
async function reset(app2) {
  app2.get("/reset", async (req, res) => {
    await knex("chapters").del();
    await knex("comics").del();
    await knex("users").del();
  });
}

// src/server.ts
var import_fastify_socket = __toESM(require("fastify-socket.io"));
var app = (0, import_fastify.default)();
app.register(import_cors.default, {
  origin: "*"
});
app.register(import_fastify_socket.default);
app.register(import_cookie.default);
app.register(loginRoutes, { prefix: "login" });
app.register(comicRoutes, { prefix: "comics" });
app.register(chapterRoutes, { prefix: "chapters" });
app.register(reset);
app.ready().then(() => {
  app.io.on("connection", (socket) => {
    console.log("Funcionou?");
  });
});
app.listen({
  port: env.PORT
}).then(() => console.log(`Rodando na porta ${env.PORT} \u{1F680} `));
