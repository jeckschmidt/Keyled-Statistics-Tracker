import express from 'express'
import path from 'path'
import { CustomError } from '../types/customError.js';

const router = express.Router()

let origin="App"
const homeDir = path.resolve();
router.get('/', (req,res,next) => {
    
    var filePath = `${homeDir}/public/frontend/homePage.html`
    res.status(200).sendFile(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                next(new CustomError({origin: origin, details: "Resource not found", error: err, cause: err, status: 404}))
            }
            return next(err)
        }
    })
})

export default router
