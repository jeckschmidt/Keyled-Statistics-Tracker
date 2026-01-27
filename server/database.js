import mysql from 'mysql2'
import { app } from '../config.js'
import fs from 'fs'
import {parse} from 'json2csv'
import path from 'path'
import { getIo } from './websocket.js'

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
                   (serial_number, flash_status, bytes_written, program_version, target_RTC, flash_date, RTC_drift, flash_provision, hostname, reader_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    let result
    try {
        result = await pool.query(query, values)
    } catch (err) {
        throw err
    }

    let {rows, columns} = await tableToJSON()
    let newRow = rows[rows.length - 1]

    let io = getIo()
    io.emit('newRow', {newRow: newRow})
    return result
}

export async function tableToCSV() {
    const pool = await getDatabasePool()
    const query = "SELECT * FROM target_information"
    
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
    const query = `SELECT id, serial_number, reader_number, hostname, flash_status, bytes_written, program_version, flash_date, flash_provision
        FROM ${table};`
    var results
    try {
        [results] = await pool.query(query)
    } catch (err) {
        throw err
    }
    
    const columnsTemp = results.length > 0 ? Object.keys(results[0]) : []
    var rows = results.length > 0 ?results.map(row => Object.values(row)) : []

    const statusMap = {1: 'pass', 0: 'fail'}
    const statusIndex = 4

    for (const row of rows) {
        row[statusIndex] = statusMap[row[statusIndex]] ?? row[statusIndex];
    }
    const columns = columnsTemp.map(processList)

    return {rows: rows, columns: columns}

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
