import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';

import { CustomError } from '../types/error.js';
import { loginAuth } from '../middleware.js';

const router = express.Router()

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
__dirname = path.join(__dirname, "../..", 'public')
let origin="App"

// home page
router.get('/home', loginAuth, (req,res,next) => {
    
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


// redirect to home page
router.get('/', (req,res,next) => {
    res.redirect('/home')
})


export default router
