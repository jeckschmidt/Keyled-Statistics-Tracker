import mysql from 'mysql2'

var pool
async function createDatabase() {
    pool = mysql.createPool({
        host: '127.0.0.1',
        user: 'newuser',
        password: 'admin',
        database: 'Keyled_Statistics',
        connectionLimit: 10
    }).promise()

    return pool
}

pool = await createDatabase()
var results = await pool.query("SELECT * FROM target_information;")
console.log(results)
