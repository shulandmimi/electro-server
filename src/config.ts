const env = process.env;

export default {
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_HOST: process.env.DB_HOST,

    mail: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASS,
        from: env.MAIL_FROM,
    },
    secret: {
        salt: env.SALT,
    },

    application: {
        host: env.APPLICATION_HOST,
    },
};
