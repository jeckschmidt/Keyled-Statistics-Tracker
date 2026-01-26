import express from 'express'
import path from 'path'
import { CustomError } from '../types/customError.js';

const router = express.Router()

const homeDir = path.resolve();
router.get('/', (req,res,next) => {
    
    var filePath = `${homeDir}/public/frontend/homePage.html`
    res.status(200).sendFile(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                return next(new CustomError({status:404, source:"App", message: "No resource found", details:err}))
            }
            return next(err)
        }
    })
})

export default router
