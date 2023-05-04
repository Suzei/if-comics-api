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
  MIGRATIONS_DIR: import_zod.z.string(),
  PORT: import_zod.z.number().default(3333)
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

// src/routes/chapters.ts
var import_node_crypto = __toESM(require("crypto"));
async function chapterRoutes(app) {
  app.post("/", async (request, reply) => {
    const createChapterSchema = import_zod2.z.object({
      chapterTitle: import_zod2.z.string(),
      chapterNumber: import_zod2.z.string(),
      chapterFile: import_zod2.z.string(),
      comicId: import_zod2.z.string()
    });
    const { chapterFile, chapterNumber, chapterTitle, comicId } = createChapterSchema.parse(request.body);
    await knex("chapters").insert({
      id: import_node_crypto.default.randomUUID(),
      chapterFile,
      chapterNumber,
      chapterTitle,
      comicId
    });
    console.log(comicId);
    return reply.status(201).send();
  });
  app.get("/:comicId", async (request) => {
    const getChapterByIdSchema = import_zod2.z.object({
      comicId: import_zod2.z.string()
    });
    const { comicId } = getChapterByIdSchema.parse(request.params);
    const chapterById = await knex("chapters").select("*").where("comicId", comicId);
    return { chapterById };
  });
  app.delete("/:comicId/:id", async (request) => {
    const deleteChapterSchema = import_zod2.z.object({
      id: import_zod2.z.string().uuid(),
      comicId: import_zod2.z.string()
    });
    const { comicId, id } = deleteChapterSchema.parse(request.params);
    await knex("chapters").delete().where("comic_id", comicId).where("id", id);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chapterRoutes
});
