/* eslint-disable prefer-promise-reject-errors */

import BigNumber from 'bignumber.js'
import moment from 'moment'
import config from '../config'
import client from '../server.js'
import logger from '../utils/logger'
import { getWeb3 } from '../utils/web3'

const web3 = getWeb3(config.server.faucetNode)
const amountToTransfer = web3.utils.toWei(config.server.faucetEth.toString())

const NeverminedFaucet = {
    /**
     * Nevermined Faucet request method
     * @Param address faucet tokens recipient
     * @Param agent
     */
    requestCrypto: async (requestAddress, agent) => {
        const balance = await web3.eth.getBalance(config.server.faucetAddress)
        if (
            new BigNumber(balance).isLessThan(new BigNumber(amountToTransfer))
        ) {
            throw new Error(
                `Faucet server is not available (Seed account does not have enought ETH to process the request)`
            )
        }

        const { body } = await client.search({
            index: config.database.index,
            body: {
                query: {
                    match: {
                        address: requestAddress.toUpperCase()
                    },
                    range: {
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        })

        if (body.hits.hits > 0) {
            logger.debug(
                'Creating document for address:' + requestAddress.toUpperCase()
            )

            await client.index(
                {
                    index: config.database.index,
                    _id: requestAddress.toUpperCase(),
                    body: {
                        address: requestAddress.toUpperCase(),
                        ethAmount: config.server.faucetEth,
                        agent: agent || 'server',
                        createdAt: new Date(Date.now())
                    }
                },
                function (err, resp, status) {
                    logger.error(resp)
                }
            )

            await client.indices.refresh({
                index: config.database.index
            })
        }

        // const doc = await Faucet.findOneAndUpdate(
        //     {
        //         $and: [
        //             {
        //                 createdAt: {
        //                     $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        //                 }
        //             },
        //             {
        //                 $or: [
        //                     {
        //                         address: requestAddress.toUpperCase()
        //                     }
        //                 ]
        //             }
        //         ]
        //     },
        //     {
        //         $setOnInsert: {
        //             address: requestAddress.toUpperCase(),
        //             ethAmount: config.server.faucetEth,
        //             agent: agent || 'server'
        //         },
        //         $inc: { insert: 1 }
        //     },
        //     {
        //         upsert: true,
        //         new: true
        //     }
        // )

        if (
            config.server.faucetTimeSpan === 0 ||
            config.server.faucetTimeSpan === '0'
        ) {
            const recordId = doc._id
            const response = await NeverminedFaucet.transferEther(
                requestAddress,
                recordId
            )
            return response
        } else {
            // if (doc.insert !== 1) {
            //     const lastRequest = moment(
            //         doc.createdAt,
            //         'YYYY-MM-DD HH:mm:ss'
            //     ).add(config.server.faucetTimeSpan, 'h')
            //     const reqTimestamp = moment()
            //     const diffStr = moment
            //         .utc(lastRequest.diff(reqTimestamp))
            //         .format('HH:mm:ss')
            //     const errorMsg = `Already requested. You can request again in ${diffStr}.`
            //     throw new Error(errorMsg)
            // } else {
            //     const recordId = doc._id
            //     const response = await NeverminedFaucet.transferEther(
            //         requestAddress,
            //         recordId
            //     )
            //     return response
            // }
        }
    },

    /**
     * Function to transfer ETH to requestAddress
     * @Param nevermined Nevermined instance
     * @Param requestAddress faucet tokens recipient
     * @Param faucet record _id
     */
    transferEther: (requestAddress, recordId) => {
        return new Promise((resolve, reject) => {
            web3.eth.personal
                .sendTransaction(
                    {
                        from: config.server.faucetAddress,
                        to: requestAddress,
                        value: amountToTransfer,
                        gas: config.server.faucetGas,
                        gasPrice: config.server.faucetGasPrice
                    },
                    config.server.faucetPassword
                )
                .then((hash) => {
                    logger.log(`ETH transaction hash ${hash}`)
                    // Faucet.findOneAndUpdate(
                    //     {
                    //         _id: recordId
                    //     },
                    //     {
                    //         ethTrxHash: hash
                    //     },
                    //     (err, rec) => {
                    //         if (err) {
                    //             logger.error(
                    //                 `Failed updating faucet record ${err}`
                    //             )
                    //         }
                    //         resolve({
                    //             statusCode: 200,
                    //             result: {
                    //                 success: true,
                    //                 trxHash: hash
                    //             }
                    //         })
                    //     }
                    // )
                })
                .catch((err) => {
                    logger.error(`Failed transfer ${err}`)
                    // Faucet.findOneAndUpdate(
                    //     {
                    //         _id: recordId
                    //     },
                    //     {
                    //         error: err
                    //     },
                    //     (err, rec) => {
                    //         if (err) {
                    //             logger.error(
                    //                 `Failed updating faucet record ${err}`
                    //             )
                    //         }
                    //         resolve()
                    //     }
                    // )
                })
        })
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
