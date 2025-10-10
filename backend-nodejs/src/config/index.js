import 'dotenv/config';

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'fixnado',
    user: process.env.DB_USER || 'fixnado_user',
    password: process.env.DB_PASSWORD || 'change_me'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret',
    expiresIn: '12h'
  }
};

export default config;
