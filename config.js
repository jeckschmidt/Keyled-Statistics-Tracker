import dotenv from 'dotenv/config'

export const app = {
    port: process.env.PORT,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    table: process.env.MYSQL_TABLE
}