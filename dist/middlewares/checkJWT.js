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

// src/middlewares/checkJWT.ts
var checkJWT_exports = {};
__export(checkJWT_exports, {
  isAuthenticated: () => isAuthenticated
});
module.exports = __toCommonJS(checkJWT_exports);
var import_jsonwebtoken = require("jsonwebtoken");
async function isAuthenticated(request, reply, done) {
  const AuthToken = request.headers.authorization;
  if (!AuthToken) {
    return reply.status(401).send({
      message: "N\xE3o autorizado."
    });
  }
  const [, token] = AuthToken.split(" ");
  try {
    (0, import_jsonwebtoken.verify)(token, "9751ba99-8c01-4a8e-815a-782ffa83daba");
    return done();
  } catch (error) {
    return reply.status(401).send("Token inv\xE1lido");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isAuthenticated
});
