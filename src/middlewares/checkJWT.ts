import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'
import { verify } from 'jsonwebtoken'
export async function isAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) {
  const AuthToken = request.headers.authorization

  if (!AuthToken) {
    return reply.status(401).send({
      message: 'Não autorizado.',
    })
  }

  const [, token] = AuthToken.split(' ')

  try {
    verify(token, '9751ba99-8c01-4a8e-815a-782ffa83daba')
    return done()
  } catch (error) {
    return reply.status(401).send('Token inválido')
  }
}
