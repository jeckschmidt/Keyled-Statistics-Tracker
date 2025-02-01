import mysql from 'mysql2'
import dotenv from 'dotenv/config'
import { app } from '../config.js'
import fs from 'fs'
import {parse} from 'json2csv'
import path from 'path'

var pool
export async function createDatabase() {
    pool = mysql.createPool({
        host: app.host,
        user: app.user,
        password: app.password,
        database: app.database,
        connectionLimit: 10
    }).promise()

    return pool
}


export async function insertIntoTarget(values) {
    const pool = await createDatabase()

    const table = process.env.MYSQL_TABLE
    const query = `INSERT INTO ${table} (serial_number, flash_status, bytes_written, program_version, target_RTC, flash_date, RTC_drift) VALUES (?, ?, ?, ?, ?, ?, ?)`
    
    var result

    try {
        result = await pool.query(query, values)
        console.log('[DATABASE] Successfully updated database')
    } catch (err) {
        console.log('[DATABASE] Error executing query')
        console.log(err)
    }

    pool.end((err) => {
        if (err) {
            console.error("[DATABASE] Database pool couldn't be closed")
        }
    })

   return result
}

export async function tableToCSV() {
    const pool = await createDatabase()

    const query = "SELECT * FROM target_information"
    const rows = (await pool.query(query))[0]

    const csvData = parse(rows)
    
    const homeDir = path.resolve();
    fs.writeFileSync(homeDir + '/public/flashes.csv', csvData)

    pool.end((err) => {
        if (err) {
            console.error("[DATABASE] Database pool couldn't be closed")
        }
    })
}
