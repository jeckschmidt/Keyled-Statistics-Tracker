import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'
import { insertIntoTarget, tableToCSV, getDatabasePool, getEntryCount, getLog } from '../database.js'
import { CustomError } from '../types/customError.js'

const router = express.Router()
router.use(bodyParser.json())

let origin = "Database API"
/**
 * @route POST /database/insert/target
 * @summary Populate a new row in the target_information database
 * @param {object} row - All of the column values that will make up the row
 */
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


/**
 * @route GET /database/get-entry-count
 * @summary Get the total entry count in the database
 * @returns {count: count}
 */
router.get('/get-entry-count', async (req, res, next) => {

    let count
    try {
        count = await getEntryCount()
    } catch (err) {
        next(new CustomError({origin: origin, details: "Failed to get DB entry count", error: err ,cause: err}))
    }
    res.status(200).json({count: count})

})

/**
 * @route GET /database/get-log
 * @summary Get the logs associated with an entry id
 * @param {string} id - The id of the entry
 * @returns {id: id}
 */
router.get('/get-log/:id', async (req, res, next) => {
    const id = req.params.id

    let log
    try {
        log = await getLog(id)
    } catch (err) {
        if (err instanceof CustomError) {
            return next(err)
        }
        next(new CustomError({origin: origin, details: `Failed to get a log file ${id}`, error: err, cause: err}))
    }

    res.status(200).json(log)
})

export default router
