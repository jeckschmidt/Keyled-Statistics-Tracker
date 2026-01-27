import express from 'express'
import http from 'http'
import dotenv from 'dotenv/config'
import path from 'path'
import helmet from 'helmet'
import { sleep } from './helpers.js'
import  { startWebSocketServer } from "./websocket.js"
import { app as appConfig } from '../config.js'
import { CustomError } from './types/customError.js'

import homeRoute from './routes/app.js'
import databaseRoute from './routes/databaseAPI.js'

var app = express()

const port = appConfig.port
const homeDir = path.resolve();

var server
async function start(app, port) {
    server = http.createServer(app)

    // start websocket server
    startWebSocketServer(server);

    server.on('listening', async ()=>{
        const addr = server.address()
        const bind =
            typeof addr === 'string'
                ? `pipe ${addr}`
                : `http://localhost:${addr.port}/home`
        await sleep(1)
        console.log(`[PROCESS] Express server listening on ${bind}`)
    })
    return server.listen(port)
}

app.use(helmet())

app.use('/home', homeRoute)
app.use('/database', databaseRoute)
app.use('/public', express.static('public'))

// global error handling middlware
app.use((err, req, res, next) => {
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
})


// start https server
start(app, port).catch(async (err)=> {
    console.error(err)
    process.exit(1)
})
