import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'
import { insertIntoTarget, tableToCSV, createDatabase } from '../database.js'

const router = express.Router()
router.use(bodyParser.json())

router.post('/insert/target', async (req,res,next)=> {
    console.log("[SERVER] new entry request")
    var body = req.body

    // Process the data into a list
    var values = Object.values(body)

    await insertIntoTarget(values)

    await tableToCSV()

    res.sendStatus(200)
})


router.get('/get-entry-count', async (req, res, next) => {

    try {
        const pool = await createDatabase()
        const [rows] = await pool.query(
            'SELECT id FROM target_information ORDER BY id DESC LIMIT 1'
        );

        if (rows.length > 0) {
            const lastValue = rows[0].id;
            res.json({count: lastValue})
        } else {
            console.log('Table is empty');
            res.json({count: 0})
        }
    } catch (err) {
        console.log(`[DATABASE] Couldn't query the database for entry count: ${err}`)
        res.status(500).send("Couldn't find the resource")
    }
})

export default router
