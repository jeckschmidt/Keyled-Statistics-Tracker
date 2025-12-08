import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'
import { insertIntoTarget, tableToCSV, createDatabase } from '../database.js'

const router = express.Router()
router.use(bodyParser.json())

router.post('/insert/target', async (req,res,next)=> {
    console.log("[SERVER] new entry reqyest")
    var body = req.body

    // Process the data into a list
    var values = Object.values(body)

    var result = await insertIntoTarget(values)

    await tableToCSV()

    res.sendStatus(200)
})

router.get('/get-table', async (req, res, next) => {

    const pool = await createDatabase()
    const query = 'SELECT * FROM target_information'
    var results
    try {
        [results] = await pool.query(query)
    } catch (err) {
        console.log(`[DATABASE] Query failed: ${err}`)
        res.status(500).send("Couldn't find the resource");
        return
    }
    
    const columnsTemp = results.length > 0 ? Object.keys(results[0]) : []
    const columns = columnsTemp.map(processList)
    var rows = results.length > 0 ?results.map(row => Object.values(row)) : []
    for (let i=0; i< rows.length;i++) {

        if (rows[i][2] == 1) {
            rows[i][2] = 'pass'
        }
        if (rows[i][2] == 0) {
            rows[i][2] = 'fail'
        }
    }
    
    res.json({columns, rows})

    pool.end((err) => {
        if (err) {
            console.error("[DATABASE] Database pool couldn't be closed")
        }
    })
})

function capitalize(string) {
    return `${String(string).charAt(0).toUpperCase()}${String(string).slice(1)}`
}

// Hard coded for max two words
function processList(string) {
    var [word1, word2] = String(string).split("_")
    if (word2 !== undefined) {
        return `${capitalize(word1)} ${capitalize(word2)}`
    }
    else {
        return  capitalize(word1)
    }
}


router.get('/get-entry-count', async (req, res, next) => {
    const pool = await createDatabase()

    const [rows] = await pool.query(
        'SELECT id FROM target_information ORDER BY id DESC LIMIT 1'
    );

    if (rows.length > 0) {
        const lastValue = rows[0].id;
        res.json({count: lastValue})
    } else {
        console.log('Table is empty');
    }
})

export default router
