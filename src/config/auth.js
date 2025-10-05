module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key_para_desarrollo',
  jwtExpiration: '24h'
};