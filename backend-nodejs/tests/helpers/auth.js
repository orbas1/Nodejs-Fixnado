import jwt from 'jsonwebtoken';

export function createTestToken(
  userId,
  { expiresIn = '1h', payload = {}, audience = 'fixnado:web', issuer = 'fixnado-api' } = {}
) {
  if (!userId) {
    throw new Error('createTestToken requires a userId');
  }

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ sub: userId, ...payload }, secret, {
    expiresIn,
    audience,
    issuer
  });
  const tokenPayload = { sub: userId, ...payload };
  return jwt.sign(tokenPayload, secret, {
    expiresIn,
    audience: 'fixnado:web',
    issuer: 'fixnado-api'
  });
  return jwt.sign(
    { sub: userId, ...payload },
    secret,
    { expiresIn, audience: 'fixnado:web', issuer: 'fixnado-api' }
  );
}

export function withAuth(requestBuilder, userId, options) {
  const token = createTestToken(userId, options);
  return requestBuilder.set('Authorization', `Bearer ${token}`);
}
