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

// src/routes/login.ts
var login_exports = {};
__export(login_exports, {
  loginRoutes: () => loginRoutes
});
module.exports = __toCommonJS(login_exports);

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

// src/routes/login.ts
var import_zod2 = require("zod");
var jwt = __toESM(require("jsonwebtoken"));
var import_bcrypt = require("bcrypt");
var import_crypto = require("crypto");
async function loginRoutes(app) {
  app.post("/", async (request, reply) => {
    const logonSchema = import_zod2.z.object({
      username: import_zod2.z.string(),
      password: import_zod2.z.string()
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
  app.get("/", async (request, reply) => {
    const users = await knex("users").select("*");
    return users;
  });
  app.post("/register", async (req, res) => {
    const createUserSchema = import_zod2.z.object({
      username: import_zod2.z.string(),
      email: import_zod2.z.string(),
      password: import_zod2.z.string()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  loginRoutes
});
