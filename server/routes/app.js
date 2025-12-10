import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { createDatabase } from '../database.js'

const router = express.Router()

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

const homeDir = path.resolve();
router.get('/', async (req,res,next) => {

    const pool = await createDatabase()
    const query = `SELECT id, serial_number, reader_number, hostname, flash_status, bytes_written, program_version, flash_date, flash_provision
        FROM target_information;`
    var results
    try {
        [results] = await pool.query(query)
    } catch (err) {
        console.log(`[DATABASE] Query failed: ${err}`)
    }
    
    const columnsTemp = results.length > 0 ? Object.keys(results[0]) : []
    var rows = results.length > 0 ?results.map(row => Object.values(row)) : []

    const statusMap = {1: 'pass', 0: 'fail'}
    const statusIndex = 4

    for (const row of rows) {
        row[statusIndex] = statusMap[row[statusIndex]] ?? row[statusIndex];
    }
    
    const columns = columnsTemp.map(processList)
    
    var filePath = `${homeDir}/frontend/homePage.ejs`
    try {
        res.render(homeDir + '/frontend/homePage.ejs', {columns: columns, rows: rows})
    } catch (err) {
        res.status(500).send(err)
    }

    pool.end((err) => {
        if (err) {
            console.error("[DATABASE] Database pool couldn't be closed")
        }
    })

})


export default router
