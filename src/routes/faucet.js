import express, { response } from 'express'
import { check, body, validationResult } from 'express-validator'
import Eth from 'ethjs'
import NeverminedFaucet from '../controllers/neverminedFaucet'
import FaucetDb from '../models/db'
import config from '../config'
import pkg from '../../package.json'
import logger from '../utils/logger'

const { faucetNode, faucetEth } = config.server
const { name, version } = pkg
const faucetRoutes = express.Router()

const faucetDb = new FaucetDb(config)

const network = faucetNode.includes('localhost')
    ? 'Spree'
    : faucetNode.includes('integration')
    ? 'Integration'
    : faucetNode.includes('qa')
    ? 'QA'
    : faucetNode.includes('production') || faucetNode.includes('nevermined.io')
    ? 'Production'
    : 'Unknown'

faucetRoutes.get('/', (req, res) => {
    if (req.get('Accept') === 'application/json') {
        res.json({
            software: name,
            version,
            network,
            keeper: faucetNode
        })
    } else {
        res.send(
            `<strong><code>
            Nevermined Faucet Server v${version}<br />
            <a href="https://github.com/keyko-io/nevermined-faucet">github.com/keyko-io/nevermined</a><br />
            <span>Running against ${network}</span>
        </code></strong>`
        )
    }
})

faucetRoutes.get(
    '/trxhash',
    [check('id', 'Faucet request ID not sent').exists()],
    (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Bad Request',
                errors: errors.array()
            })
        } else {
            NeverminedFaucet.getFaucetRequestEthTrxHash(req.query.id)
                .then((response) => res.status(200).json(response))
                .catch((error) =>
                    res.status(error.statusCode).json(error.result)
                )
        }
    }
)

faucetRoutes.post(
    '/faucet',
    [
        check('address', 'Ethereum address not sent').exists(),
        body('address').custom((value) => {
            if (!Eth.isAddress(value)) {
                return Promise.reject(new Error('Invalid Ethereum address'))
            } else {
                return Promise.resolve()
            }
        })
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Bad Request',
                errors: errors.array()
            })
        } else {
            try {
                const trxHash = await NeverminedFaucet.requestCrypto(
                    faucetDb,
                    req.body.address,
                    req.body.agent
                )
                if (trxHash != null) {
                    logger.info(`Faucet Success: ${trxHash}`)
                    res.status(201).json({
                        success: true,
                        message: `Successfully added ${faucetEth} ETH to your account.`,
                        trxHash
                    })
                } else {
                    res.status(500).json({
                        success: false,
                        message: `Unable to assign Eth`
                    })
                }
            } catch (error) {
                logger.error(`The error ${error}`)
                res.status(500).json({ success: false, message: error.message })
            }
        }
    }
)

export default faucetRoutes
