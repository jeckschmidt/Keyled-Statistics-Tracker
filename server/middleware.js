import { CustomError } from "./types/customError.js"

// global error handling middlware
export function globalErrorHandler(err, req, res, next) {
    if (err instanceof CustomError) {
        console.error(`[${err.origin}] ${err.details} --${err.message} ${err.error}: ${err.stack}`)

        return res.status(err.status).json({
            details: err.details
        })
    }

    console.err("[Error Handler] Unexpected error:", err)
    return res.status(500).json({
        message: "Internal Server Error"
    })
}