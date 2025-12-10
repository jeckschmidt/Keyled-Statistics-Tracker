import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { createDatabase } from '../database.js'

const router = express.Router()

const homeDir = path.resolve();
router.get('/', async (req,res,next) => {
    
    var filePath = `${homeDir}/public/frontend/homePage.html`
    try {
        res.sendFile(filePath)
    } catch (err) {
        res.status(500).send(err)
    }

})


export default router
