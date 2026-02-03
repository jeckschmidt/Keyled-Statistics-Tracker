import express from 'express'
import path from 'path'
import { CustomError } from '../types/customError.js';
import { fileURLToPath } from 'url';

const router = express.Router()

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
__dirname = path.join(__dirname, "../..", 'public')

let origin="App"
router.get('/', (req,res,next) => {
    
    var filePath = `${__dirname}/frontend/homePage.html`
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
