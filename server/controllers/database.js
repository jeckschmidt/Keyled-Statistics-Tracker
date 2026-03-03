import mysql from 'mysql2'
import { app } from '../config.js'
import fs from 'fs'
import {parse} from 'json2csv'
import path from 'path'
import { getIo } from './websocket.js'
import { CustomError } from './types/customError.js'

let pool
export async function getDatabasePool() {
    if (!pool) {
        pool = mysql.createPool({
            host: app.host,
            user: app.user,
            password: app.password,
            database: app.database,
            connectionLimit: 10,
        }).promise()
    }
    return pool
}


export async function insertIntoTarget(values) {
    const pool = await getDatabasePool()
    const table = app.table
    const query = `INSERT INTO ${table}
                   (serial_number, status, bytes_written, program_version, target_RTC, flash_date, RTC_drift, flash_provision, hostname, reader_number, logs)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    let result
    try {
        result = await pool.query(query, values)
    } catch (err) {
        throw err
    }

    let {rows, columns} = await tableToJSON()
    let newRow = rows[rows.length - 1]

    let io = getIo()
    const statusColumnIndex = app.statusColumnIndex
    io.emit('newRow', {newRow: newRow, statusColumnIndex: statusColumnIndex})
    return result
}

export async function tableToCSV() {
    const pool = await getDatabasePool()
    const table = app.table
    const query = `SELECT id, serial_number, reader_number, hostname, flash_provision, status, bytes_written, program_version, flash_date
        FROM ${table};`
    
    let rows
    try {
        rows = (await pool.query(query))[0]
    } catch (err) {
        throw err
    }
    
    const csvData = parse(rows)
    try {
        fs.writeFileSync(`${app.csvLocation}/flashes.csv`, csvData)
    } catch (err) {
        throw err
    }
}


export async function tableToJSON() {
    const pool = await getDatabasePool()
    const table = app.table
    const query = `SELECT id, serial_number, reader_number, hostname, flash_provision, status, bytes_written, program_version, flash_date
        FROM ${table};`
    let results
    try {
        [results] = await pool.query(query)
    } catch (err) {
        throw err
    }
    
    const columnsTemp = results.length > 0 ? Object.keys(results[0]) : []
    let rows = results.length > 0 ?results.map(row => Object.values(row)) : []

    const statusMap = {1: 'pass', 0: 'fail'}
    const statusColumnIndex = app.statusColumnIndex

    for (const row of rows) {
        row[statusColumnIndex] = statusMap[row[statusColumnIndex]] ?? row[statusColumnIndex];
    }
    const columns = columnsTemp.map(processList)

    return {rows: rows, columns: columns, statusColumnIndex: statusColumnIndex}

}


export async function getEntryCount() {

    const pool = await getDatabasePool()
    const table = app.table
    const query = `SELECT id from ${table} ORDER BY id DESC LIMIT 1`
    let rows
    let lastValue

    try {
        [rows] = await pool.query(query)
    } catch (err) {
        throw err
    }

    if (rows.length > 0) {
        lastValue = rows[0].id;
        return lastValue
    }
    return 0
}


export async function getLog(id) {
    const pool = await getDatabasePool()
    const table = app.table

    const totalEntries = await getEntryCount()
    if (id > totalEntries || id < 1) {
        throw new CustomError({origin: "Database Manager", details: "Resource not found", message: `Id entry ${id} doesn't exist`, status: 404})
    }

    const query = `SELECT logs FROM ${table} WHERE id=${id};`
    let logs

    try {
        [logs] = await pool.query(query)
    } catch (err) {
        throw err
    }
    
    return logs[0]
}


function capitalize(string) {
    return `${String(string).charAt(0).toUpperCase()}${String(string).slice(1)}`
}

function processList(string) {
    var words = String(string).split("_")
    words = words.map(function(word) {
        return capitalize(word)
    })
    if (String(string) == "flash_provision") {
        return words.join("/")
    }
    return words.join(" ")
}
