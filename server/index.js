import express from 'express'
import http from 'http'
import dotenv from 'dotenv/config'
import path from 'path'
import helmet from 'helmet'
import { createDatabase } from './database.js'
import { sleep } from './helpers.js'

import homeRoute from './routes/app.js'
import databaseRoute from './routes/databaseAPI.js'

var app = express()

const port = process.env.PORT
const homeDir = path.resolve();

async function start(app, port) {
    var server = http.createServer(app)
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

app.use('/home', homeRoute)
app.use('/database', databaseRoute)
app.use(express.static(homeDir + '/frontend'))
app.use(express.static(homeDir + '/public'))

app.use(helmet())

app.set('view engine', 'ejs')

start(app, port).catch(async (err)=> {
    console.error(err)
    process.exit(1)
})
