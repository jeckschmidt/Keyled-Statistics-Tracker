import mysql from 'mysql2'
import fs from 'fs'
import {parse} from 'json2csv'
import path from 'path'

import { getIo } from './websocket.js'
import { CustomError } from '../types/error.js'
import { app } from '../../config.js'

const provisionStatusColIndex = app.provisionStatusColIndex
const rtcStatusColIndex = app.rtcStatusColIndex
const readerNumberColIndex = app.readerNumberColIndex
const activeColIndex = app.activeColIndex


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
    const tableCols = columns.join(", ")
    const tableValues = ("?".repeat(columns.length)).split("").join(",")

    const query = `INSERT INTO ${table}
                    (${tableCols})
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
 * @param {{column: string, value: any}} key - The key for the entry; ... WHERE column=value 
 * @param {string[]} columns - Which columns are wanted
 * @returns {object[]} JSON entry inside a list
 */
async function getTableEntry(table, key, columns) {
    const pool = await getDatabasePool()
    const tableColumns = columns.join(",")

    let value = key.value
    if (typeof key.value === 'string') {
        value = `"${key.value}"`
    }

    const query = `SELECT ${tableColumns}
                   FROM ${table}
                   WHERE ${key.column}=${value}`

    
    try {
        const [entry, _] = await pool.query(query)
        return entry
    } catch (err) {
        throw err
    }
}


/**
 * @summary Inserts an entry into the target information table
 * @param {any[]} values - The table to query
 */
export async function insertIntoTarget(values) {
    const table = app.targetTable
    const tableRows = Object.values(app.targetTableCols)
    let result
    try {
        await tableInsert(table, tableRows, values)
    } catch (err) {
        throw err
    }

    let {rows, _} = await tableToJSON()
    let newRow = rows[rows.length - 1]

    let io = getIo()
    io.emit('newRow', {
            newRow: newRow,
            provisionStatusColIndex: provisionStatusColIndex,
            rtcStatusColIndex: rtcStatusColIndex,
            readerNumberColIndex: readerNumberColIndex,
            activeColIndex: activeColIndex
        })

    return result
}


/**
 * @summary Inserts new entry into secrets table
 * @param {string} user - User of the secret
 * @param {string[]} hashed_key - The hashed secret of the user
 */
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


/**
 * @summary Gets all of the hashed secrets in the secrets table
 */
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


/**
 * @summary Inserts new entry into secrets table
 * @param {string} username - The username of the user
 * @param {string[]} password_hash - The hashed password of the user
 */
export async function insertIntoUsers(username, password_hash) {
    const table = app.usersTable
    const columns = app.usersTableColumns
    const values = [username, password_hash]

    try {
        await tableInsert(table, columns, values)
    } catch (err) {
        throw err
    }
}


/**
 * @summary Gets the username and password hash of a user
 * @param {string} username - Username identifying a user
 */
export async function getUser(username) {

    const table = app.usersTable
    const columns = ["username", "password_hash"]
    const key = {
        column: "username",
        value: username,
    }
    
    try {
        let temp = await getTableEntry(table, key, columns)
        let user = temp

        return user
    } catch (err) {
        throw err
    }
}


/**
 * @summary Converts the target information table into a .csv file (omits logs)
 */
export async function tableToCSV() {
    const table = app.targetTable
    const cols = app.targetTableCols
    const columns = [
        "id",
        cols.macAddress,
        cols.provisionStatus,
        cols.rtcStatus,
        cols.programVersion,
        cols.date,
        cols.flashProvision,
        cols.hostname,
        cols.readerNumber,
        cols.active
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

/**
 * @summary Converts the target information table into a JSON (omits logs)
 */
export async function tableToJSON() {

    const table = app.targetTable
    const cols = app.targetTableCols
    const tableColumns = [
        "id",
        cols.macAddress,
        cols.readerNumber,
        cols.provisionStatus,
        cols.rtcStatus,
        cols.flashProvision,
        cols.hostname,
        cols.date,
        cols.active,
    ]

    try {
        var results = await getTableAllRows(table, tableColumns, false)
    } catch (err) {
        throw err
    }

    const columnsTemp = results.length > 0 ? Object.keys(results[0]) : []
    let rows = results.length > 0 ?results.map(row => Object.values(row)) : []

    const provisionStatusMap = {1: 'pass', 0: 'fail'}
    const rtcStatusMap = {1: 'pass', 0: 'fail'}
    const activeStatusMap = {1: 'true', 0: 'false'}

    for (const row of rows) {
        row[provisionStatusColIndex] = provisionStatusMap[row[provisionStatusColIndex]] ?? row[provisionStatusColIndex]
        row[rtcStatusColIndex] = rtcStatusMap[row[rtcStatusColIndex]] ?? row[rtcStatusColIndex]
        row[activeColIndex] = activeStatusMap[row[activeColIndex]] ?? row[activeColIndex]
    }
    const columns = columnsTemp.map(processList)

    let newTable = {
        rows: rows,
        columns: columns,

        provisionStatusColIndex: provisionStatusColIndex,
        rtcStatusColIndex: rtcStatusColIndex,
        readerNumberColIndex: readerNumberColIndex,
        activeColIndex: activeColIndex
    }
    return newTable

}


/**
 * @summary Gets the amount of entries in target information
 * @returns {int} entryCount - The number of entries 
 */
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


/**
 * @summary Gets the log associated with an id
 * @param {int} id - The primary key of the target information table
 * @returns {string} - The esptool.py log
 */
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


/**
 * @summary Updates the reader number of the associated id
 * @param {int} id - The primary key of the table
 * @param {string} readerNumber - New reader number
 */
export async function updateReaderNumber(id, readerNumber) {
    const pool = await getDatabasePool()
    const table = app.targetTable
    const query = `UPDATE ${table}
                   SET reader_number="${readerNumber}"
                   WHERE id=${id}`

    try {
        await pool.query(query)
        console.log(`[DATABASE API] Reader number for entry ${id} changed to ${readerNumber}`)
    } catch (err) {
        throw err
    }
}


/* helpers */
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

    if (String(string) == "date") {
        return `${words} (UTC)`
    }

    return words.join(" ")
}
