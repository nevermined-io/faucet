import 'core-js/stable'
import 'regenerator-runtime/runtime'
import express from 'express'
import compression from 'compression'
// import mongoose from 'mongoose'
const { Client } = require('@elastic/elasticsearch')
import cors from 'cors'
import bodyParser from 'body-parser'
import boxen from 'boxen'
import config from './config'
import logger from './utils/logger'
import faucetRoutes from './routes/faucet'

logger.info('Starting Faucet Server...')

const app = express()

app.use(cors())
app.use(compression())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/', faucetRoutes)

export const client = new Client({
    node: config.database.uri,
    auth: {
        username: config.database.username,
        password: config.database.password
    },
    maxRetries: 5,
    requestTimeout: 60000
})

client.indices
    .create({
        index: config.database.index
    })
    .catch((error) => {
        logger.error('Unable to create index: ')
        logger.error(error)
    })

// mongoose
//     .connect(config.database.uri, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         useCreateIndex: true,
//         useFindAndModify: false,
//         reconnectTries: Number.MAX_VALUE,
//         reconnectInterval: 1000
//     })
//     .catch((error) => {
//         logger.error('Error connecting to database:')
//         logger.error(error)
//         process.exit(1)
//     })

const server = app.listen(config.server.port, (error) => {
    if (error) {
        logger.error('Error starting server:')
        logger.error(error)
        process.exit(1)
    }
    logger.info(
        boxen(
            `Nevermined Faucet Server\n   running on port ${config.server.port}`,
            {
                padding: 2
            }
        )
    )
})

export default server
