import express from 'express'
import http from 'http'
import dotenv from 'dotenv/config'
import path from 'path'
import helmet from 'helmet'
import { sleep } from './helpers.js'
import  { startWebSocketServer } from "./websocket.js"
import { app as appConfig } from '../config.js'
import { globalErrorHandler } from './middleware.js'
import { fileURLToPath } from 'url'
import { tableToCSV } from './database.js'

import homeRoute from './routes/app.js'
import databaseRoute from './routes/databaseAPI.js'
import { table } from 'console'

var app = express()

const port = appConfig.port
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var server
async function start(app, port) {
    server = http.createServer(app)

    // start websocket server
    startWebSocketServer(server);

    // make flashes.csv accessible
    try {
        await tableToCSV()
    } catch (err) {
        console.error("[SERVER ERROR] Couldn't create flashes.csv on startup:", err)
    }

    server.on('listening', async ()=>{
        const addr = server.address()
        const bind =
            typeof addr === 'string'
                ? `pipe ${addr}`
                : `http://localhost:${addr.port}/home`
        await sleep(1)
        console.log(`[PROCESS] Express server listening on ${bind}`)
    })
    return server.listen({port: port, host: "0.0.0.0"})
}

// app.use(helmet())
app.set('trust proxy', true)

app.use('/home', homeRoute)
app.use('/database', databaseRoute)
app.use(express.static(path.join(__dirname, "..", "public")))

// global error handling middlware
app.use(globalErrorHandler)


// start https server
start(app, port).catch(async (err)=> {
    console.error(err)
    process.exit(1)
})
