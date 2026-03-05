import mysql from 'mysql2'
import fs from 'fs'
import {parse} from 'json2csv'
import path from 'path'

import { getIo } from './websocket.js'
import { CustomError } from '../types/error.js'
import { app } from '../../config.js'

let pool
async function getDatabasePool() {
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

/**
 * @summary Generic function for inserting new row into a table
 * @param {string} table - The table to query
 * @param {string[]} columns - All of the column values that will make up the rows
 * @param {any[]} values - Ordered, the values to be inserted; correlated to rows
 * @return
 */
async function tableInsert(table, columns, values) {
    const pool = await getDatabasePool()
    const tableRows = columns.join(", ")
    const tableValues = ("?".repeat(columns.length)).split("").join(",")
    const query = `INSERT INTO ${table}
                    (${tableRows})
                    VALUES (${tableValues})`

    try {
        const result = await pool.query(query, values)
        return result
    } catch (err) {
        throw err
    }
}

/**
 * @summary Generic function for getting one entry from a table
 * @param {string} table - The table to query
 * @param {string[]} columns - Which columns are wanted
 * @returns {object[]} Returns list of all entries
 */

async function getTableAllRows(table, columns=null, isAll=true) {
    const pool = await getDatabasePool()
    try {
        const tableColumns = (isAll) ? '*' : columns.join(",")
        const query = `SELECT ${tableColumns} FROM ${table}`
        const [entries, _] = await pool.query(query)
        return entries
    } catch (err) {
        throw err
    }
}
 

/**
 * @summary Generic function for getting one entry from a table
 * @param {string} table - The table to query
 * @param {{column: string, value}} key - The key for the entry; ... WHERE column=value 
 * @param {string[]} columns - Which columns are wanted
 * @returns {object[]} JSON entry inside a list
 */
async function getTableEntry(table, key, columns) {
    const pool = await getDatabasePool()
    const tableColumns = columns.join(",")
    const query = `SELECT ${tableColumns}
                   FROM ${table}
                   WHERE ${key.column}=${key.value}`
    
    try {
        const [entry, _] = await pool.query(query)
        return entry
    } catch (err) {
        throw err
    }
}


export async function insertIntoTarget(values) {
    const table = app.targetTable
    const tableRows = app.targetTableColumns
    let result
    try {
        await tableInsert(table, tableRows, values)
    } catch (err) {
        throw err
    }

    let {rows, columns} = await tableToJSON(true)
    let newRow = rows[rows.length - 1]

    let io = getIo()
    const statusColumnIndex = app.statusColumnIndex
    io.emit('newRow', {newRow: newRow, statusColumnIndex: statusColumnIndex})
    return result
}


export async function insertIntoSecrets(user, hashed_key) {
    const table = app.secretsTable
    const columns = app.secretsTableColumns
    const values = [hashed_key, user]

    try {
        await tableInsert(table, columns, values)
    } catch (err) {
        throw err
    }
}


export async function getHashedKeys() {

    const table = app.secretsTable
    const columns = ["hashed_secret"]
    
    try {
        let temp = await getTableAllRows(table, columns)
        const hashedKeys = temp.map(temp => temp.hashed_secret) 

        return hashedKeys
    } catch (err) {
        throw err
    }
}


export async function tableToCSV() {
    const table = app.targetTable
    const columns = [
        "id",
        "serial_number",
        "reader_number",
        "hostname",
        "flash_provision",
        "status",
        "bytes_written",
        "program_version",
        "flash_date"
    ]

    try {
        var rows = await getTableAllRows(table, columns, false)
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


let inMemTable
export async function tableToJSON() {

    const table = app.targetTable
    const tableColumns = [
        "id",
        "serial_number",
        "reader_number",
        "hostname",
        "flash_provision",
        "status",
        "bytes_written",
        "program_version",
        "flash_date"
    ]
    try {
        var results = await getTableAllRows(table, tableColumns, false)
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

    inMemTable = {rows: rows, columns: columns, statusColumnIndex: statusColumnIndex}
    return inMemTable

}


export async function getEntryCount() {

    const pool = await getDatabasePool()
    const table = app.targetTable
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
    // const pool = await getDatabasePool()
    // const table = app.targetTable

    const totalEntries = await getEntryCount()
    if (id > totalEntries || id < 1) {
        throw new CustomError({origin: "Database Manager", details: "Resource not found", message: `Id entry ${id} doesn't exist`, status: 404})
    }

    const table = app.targetTable
    const key = {
        column: "id",
        value: id
    }

    try {
        var log = await getTableEntry(table, key, ["logs"])
        return log[0]
    } catch (err) {
        throw err
    }
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
