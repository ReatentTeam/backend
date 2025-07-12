export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  mailer: {
    email: process.env.NODEMAILER_EMAIL,
    password: process.env.NODEMAILER_PASSWORD,
    port: parseInt(process.env.NODEMAILER_PORT),
  },
  db:{
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  jwt:{
    secret: process.env.JWT_SECRET
  },
//   appPassword: process.env.APP_PASSWORD,
});