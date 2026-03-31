import { CustomError } from "./types/error.js"
import { getHashedKeys } from './controllers/database.js'
import { compareHash, getSessionId } from './controllers/auth.js'


// global error handling middlware
export function globalErrorHandler(err, req, res, next) {
    if (err instanceof CustomError) {
        console.error(`[${err.origin}] ${err.details} --${err.message} ${err.error}: ${err.stack}`)

        return res.status(err.status).json({
            message: err.details
        })
    }

    console.error("[Error Handler] Unexpected error:", err)
    return res.status(500).json({
        message: "Internal Server Error"
    })
}


export async function apiAuth(req, res, next) {

    // get api key from header
    const key = req.headers['x-api-key']
    if (!key) {
        return res.status(401).json({message: "No authorization provided"})
    }

    // get list of hashed keys
    const hashedKeys = await getHashedKeys()

    // hash the key and check against the list of keys
    for (let hashedKey of hashedKeys) {
        if (compareHash(key, hashedKey)) {
            return next()
        }
    }

    // return 401 if it doesn't match
    return res.status(401).json({message: "Invalid authorization"})
}

export async function loginAuth(req, res, next) {

    const sessionId = req.cookies.sessionId

    // validate session id
    if (sessionId === undefined) {
        return res.status(401).redirect('/login')
    }
    if (getSessionId(sessionId) === undefined) {
        return res.status(401).redirect('/login')
    }

    return next()
}