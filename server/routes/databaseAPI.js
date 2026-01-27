import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'
import { insertIntoTarget, tableToCSV, getDatabasePool } from '../database.js'
import { CustomError } from '../types/customError.js'

const router = express.Router()
router.use(bodyParser.json())

let origin = "Database API"
router.post('/insert/target', async (req,res,next)=> {
    console.log("[Database API] New entry requested to be entered....")
    var body = req.body

    // Process the data into a list
    var values = Object.values(body)

    try {
        await insertIntoTarget(values)
        await tableToCSV()
        console.log("[Database API] Entry entered successfully")
        res.status(200).json({message: "Success"})
    } catch (err) {
        next(new CustomError({origin: origin, details: "DB Transaction failure", error: err, cause: err}))
    }
})


router.get('/get-entry-count', async (req, res, next) => {

    try {
        const pool = await getDatabasePool()
        const [rows] = await pool.query(
            'SELECT id FROM target_information ORDER BY id DESC LIMIT 1'
        );

        if (rows.length > 0) {
            const lastValue = rows[0].id;
            res.status(200).json({count: lastValue})
        } else {
            res.status(200).json({count: 0})
        }
    } catch (err) {
        next(new CustomError({origin: origin, details: "Failed to get DB entry count", cause: err}))
    }
})

export default router
