import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'

import { insertIntoTarget, tableToCSV, getEntryCount, getLog, updateReaderNumber } from '../controllers/database.js'
import { CustomError } from '../types/error.js'
import { apiAuth } from '../middleware.js'
import { app } from '../../config.js'

const router = express.Router()
router.use(bodyParser.json())

let origin = "Database API"


/**
 * @route POST /database/insert/target
 * @summary Populate a new row in the target_information database
 * @param {object} row - All of the column values that will make up the row
 */
router.post('/insert/target', apiAuth, async (req, res, next)=> {
    console.log("[Database API] New entry requested to be entered....")
    var body = req.body

    // validate data
    const tableColumns = Object.values(app.targetTableCols)
    for (const key of Object.keys(body)) {
        if (!tableColumns.includes(key)) {
            return res.status(400).json({message: "Missing required fields"})
        }
    }

    // re-order to match database columns
    let temp = []
    for (const key of Object.values(tableColumns)) {
        const value = body[key]
        temp.push(value)
    }

    // parse into list
    const values = Object.values(temp)

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
 * @returns {int} - Number of entries
 */
router.get('/get-entry-count', apiAuth, async (req, res, next) => {

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
 * @returns {string} - The log associated with the id
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


/**
 * @route POST /database/update-reader-number
 * @summary Update a reader number of the associated id
 * @param {int} readerNumber - The new reader number to be entered
 */
router.post('/update-reader-number/:id', async (req, res, next) => {
    const id = req.params.id
    const readerNumber = req.body.readerNumber

    try {
        await updateReaderNumber(id, readerNumber)
    } catch (err) {
        return next(new CustomError({origin: origin, details: `Failed to update reader number`, error: err, cause: err}))
    }

    res.status(200).json({message: "Success"})
})


export default router
