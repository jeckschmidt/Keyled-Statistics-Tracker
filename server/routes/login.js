import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser'

import { getUser } from '../controllers/database.js';
import { CustomError } from '../types/error.js';
import { isPasswordValid, createSession } from '../controllers/auth.js';

const router = express.Router()
router.use(bodyParser.json())

const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
__dirname = path.join(__dirname, "../..", 'public')
let origin="Login"

// login page
router.get('/', (req,res,next) => {
    
    var filePath = `${__dirname}/frontend/loginPage.html`
    res.status(200).sendFile(filePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                next(new CustomError({origin: origin, details: "Resource not found", error: err, cause: err, status: 404}))
            }
            return next(err)
        }
    })
})


// login validation
router.post('/', async (req, res, next) => {

    let body = req.body
    let username = body.username
    let password = body.password

    // validate input
    if (typeof username !== 'string' || username.length === 0) {
        return res.status(400).json({isSuccess: false, message: "Username cannot be empty"})
    }
    if (typeof username !== 'string' || password.length === 0) {
        return res.status(400).json({isSuccess: false, message: "Password cannot be empty"})
    }
    
    // check if user exists
    try {
        var user = await getUser(username)
    } catch (err) {
        return next(new CustomError({origin: origin, details: "Login Validation Failure", error: err, cause: err}))
    }

    if (user.length === 0) {
        return res.status(401).json({isSuccess: false, message: "User does not exist"})
    }


    // check if password is valid
    const hash = user[0].password_hash
    if (!(await isPasswordValid(password, hash))) {
        return res.status(401).json({isSuccess: false, message: "Incorrect password"})
    }

    // create session
    const session = createSession(username)
    
    res.cookie('sessionId', session, {httpOnly: true, sameSite: 'strict', maxAge: 1000 * 60 * 43800})
    return res.status(200).json({isSuccess: true, message: "Successfully authorized"})
})

export default router