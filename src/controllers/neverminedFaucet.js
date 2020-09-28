/* eslint-disable prefer-promise-reject-errors */

import BigNumber from 'bignumber.js'
import moment from 'moment'
import config from '../config'
import { FaucetDb } from '../models/db'
// import client from '../server.js'
import logger from '../utils/logger'
import { getWeb3 } from '../utils/web3'

const client = require('../server').client
const web3 = getWeb3(config.server.faucetNode)
const amountToTransfer = web3.utils.toWei(config.server.faucetEth.toString())

const NeverminedFaucet = {
    /**
     * Nevermined Faucet request method
     * @Param address faucet tokens recipient
     * @Param agent
     */
    requestCrypto: async (faucetDb, requestAddress, agent) => {
        const balance = await web3.eth.getBalance(config.server.faucetAddress)
        logger.debug(`Faucet server balance: ${balance}`)
        if (
            new BigNumber(balance).isLessThan(new BigNumber(amountToTransfer))
        ) {
            throw new Error(
                `Faucet server is not available (Seed account does not have enought ETH to process the request)`
            )
        }

        logger.debug(
            `Searching for indexed document with address ${requestAddress} in ${config.database.index}`
        )

        let numDocuments = 0
        let document
        try {
            const body = await faucetDb.searchAddress(
                requestAddress,
                config.database.index
            )
            numDocuments = body.hits.total
            if (numDocuments > 0) document = body.hits.hits[0]._source
        } catch (error) {
            throw new Error(`Error searching for documents: ${error}`)
        }

        logger.debug(`Hits: ${numDocuments}`)

        if (
            numDocuments < 1 ||
            config.server.faucetTimeSpan === 0 ||
            config.server.faucetTimeSpan === '0'
        ) {
            logger.debug(
                'Transfering Ether to address ' + requestAddress.toUpperCase()
            )

            try {
                const hash = await NeverminedFaucet.transferEther(
                    requestAddress
                )
                logger.debug(`Transfered ETH to address, hash: ${hash}`)
                await faucetDb.index(
                    requestAddress,
                    config.server.faucetEth,
                    hash,
                    agent
                )
                logger.debug(
                    `Added document to the database for addres ${requestAddress}`
                )
                return hash
            } catch (error) {
                logger.error(`Error during the Eth allocation: ${error}`)
                return
            }
        } else {
            logger.debug(`Document already found: ${document.ethTrxHash}`)
            const lastRequest = moment(
                document.createdAt,
                'YYYY-MM-DD HH:mm:ss'
            ).add(config.server.faucetTimeSpan, 'h')
            const reqTimestamp = moment()
            const diffStr = moment
                .utc(lastRequest.diff(reqTimestamp))
                .format('HH:mm:ss')
            const errorMsg = `Already requested. You can request again in ${diffStr}.`
            throw new Error(errorMsg)
        }
    },

    /**
     * Function to transfer ETH to requestAddress
     * @Param requestAddress faucet tokens recipient
     */
    transferEther: async (requestAddress) => {
        const hash = web3.eth.personal.sendTransaction(
            {
                from: config.server.faucetAddress,
                to: requestAddress,
                value: amountToTransfer,
                gas: config.server.faucetGas,
                gasPrice: config.server.faucetGasPrice
            },
            config.server.faucetPassword
        )
        return hash
    },

    /**
     * Get Trx hash of ETH deposit
     * @Param recordId faucet request ID
     */
    getFaucetRequestEthTrxHash: (recordId) => {
        return new Promise((resolve, reject) => {
            // Faucet.findOne({
            //     _id: recordId
            // }).exec((err, data) => {
            //     if (err)
            //         reject({
            //             statusCode: 500,
            //             result: {
            //                 success: false,
            //                 message: err.message
            //             }
            //         })
            //     if (!data) {
            //         reject({
            //             statusCode: 400,
            //             result: {
            //                 success: false,
            //                 message: 'Faucet record not found'
            //             }
            //         })
            //     } else {
            //         resolve({
            //             statusCode: 200,
            //             result: {
            //                 success: true,
            //                 trxHash: data.ethTrxHash
            //             }
            //         })
            //     }
            // })
        })
    }
}

export default NeverminedFaucet
