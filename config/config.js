module.exports = {
  development: {
    storage: './db.development.sqlite',
    dialect: 'sqlite',
  },
  test: {
    username: '',
    password: '',
    database: '',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOSTNAME,
    dialect: 'postgres',
  },
};
