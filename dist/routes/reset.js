"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/reset.ts
var reset_exports = {};
__export(reset_exports, {
  reset: () => reset
});
module.exports = __toCommonJS(reset_exports);

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

// src/routes/reset.ts
async function reset(app) {
  app.get("/reset", async (req, res) => {
    await knex("chapters").del();
    await knex("comics").del();
    await knex("users").del();
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  reset
});
