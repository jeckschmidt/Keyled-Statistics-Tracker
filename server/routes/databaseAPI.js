import express from 'express'
import mysql from 'mysql2'
import bodyParser from 'body-parser'
import { insertIntoTarget } from '../database.js'

const router = express.Router()
router.use(bodyParser.json())

router.post('/insert/target', async (req,res,next)=> {
    var body = req.body

    // Process the data into a list
    var values = Object.values(body)

    await insertIntoTarget(values)
    res.sendStatus(200)
})

export default router