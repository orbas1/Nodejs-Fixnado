const personaRoleMap = {
  user: ['user'],
  admin: ['company'],
  provider: ['company'],
  serviceman: ['servicemen'],
  enterprise: ['company']
};

export function authorizePersonaAccess(req, res, next) {
  const persona = req.params.persona?.toLowerCase();
  const allowed = personaRoleMap[persona];

  if (!allowed) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!allowed.includes(req.user.type)) {
    return res.status(403).json({ message: 'persona_forbidden' });
  }

  return next();
}

export default authorizePersonaAccess;
