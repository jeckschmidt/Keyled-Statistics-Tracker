import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { createDatabase } from '../database.js'
import { create } from 'domain'

const router = express.Router()

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

const homeDir = path.resolve();
router.get('/', async (req,res,next) => {

    const pool = await createDatabase()
    const query = 'SELECT * FROM target_information'
    var results
    try {
        [results] = await pool.query(query)
        console.log("[DATABASE] Results found")
    } catch (err) {
        console.log(`[DATABASE] Query failed: ${err}`)
    }
    
    const columnsTemp = results.length > 0 ? Object.keys(results[0]) : []
    var rows = results.length > 0 ?results.map(row => Object.values(row)) : []
    
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
