import config from '../config'
import logger from '../utils/logger'
const { Client } = require('@elastic/elasticsearch')

class FaucetDb {
    constructor(config) {
        try {
            this.client = new Client({
                node: config.database.uri,
                auth: {
                    username: config.database.username,
                    password: config.database.password
                },
                maxRetries: 5,
                requestTimeout: 60000
            })
            this.ping()
            this.initializeIndex(config.database.index)
        } catch (error) {
            logger.error(`Unable to initialize client: ${error}`)
        }
    }

    async initializeIndex(indexName) {
        const exists = await this.indexExists(indexName)
        logger.debug(`Index Exists: ${exists}`)
        if (!exists) {
            await this.createIndex(indexName)
                .then(this.initMapping(indexName))
                .catch((error) =>
                    logger.error(`Error initializing index: ${error}`)
                )
        }
    }

    async indexExists(indexName) {
        logger.debug(`Checking if index exists`)
        try {
            const result = await this.client.indices.exists({
                index: indexName
            })
            return result.body
        } catch (error) {
            logger.error(`Error checking index: ${error}`)
            return false
        }
    }

    async createIndex(indexName) {
        logger.debug(`Creating index ${indexName}`)
        try {
            return await this.client.indices.create({
                index: indexName
            })
        } catch (error) {
            logger.error(`Error creating index ${indexName} - ${error}`)
        }
    }

    async deleteIndex(indexName) {
        logger.debug(`Deleting index ${indexName}`)
        try {
            return await this.client.indices.delete({
                index: indexName
            })
        } catch (error) {
            logger.error(`Error deleting index ${indexName} - ${error}`)
        }
    }

    async initMapping(indexName) {
        return await this.client.indices
            .putMapping({
                index: indexName,
                type: 'request',
                body: {
                    properties: {
                        address: { type: 'string' },
                        ethAmount: { type: 'long' },
                        ethTrxHash: { type: 'string' },
                        agent: { type: 'string' },
                        createdAt: { type: 'date' }
                    }
                }
            })
            .catch((error) =>
                logger.error(
                    `Error setting mapping to index ${indexName} - ${error}`
                )
            )
    }

    async ping() {
        this.client
            .ping()
            .then(logger.debug(`Ping returned`))
            .catch((error) =>
                logger.error(`Unable to contact Elastic server: ${error}`)
            )
    }

    async deleteIndexDocuments(indexName) {
        await this.client
            .deleteByQuery({
                index: indexName,
                refresh: true,
                body: {
                    query: {
                        match_all: {}
                    }
                }
            })
            .catch((error) =>
                logger.error(`Error deleting documents: ${error}`)
            )
    }

    async index(ethAddress, faucetEth, hash, agent) {
        await this.client
            .index({
                index: config.database.index,
                type: 'request',
                refresh: true,
                body: {
                    address: ethAddress.toUpperCase(),
                    ethAmount: faucetEth,
                    ethTrxHash: hash,
                    agent: agent || 'server',
                    createdAt: new Date(Date.now())
                }
            })
            .then(logger.debug(`Inserted document with address ${ethAddress}`))
    }

    async searchAddress(ethAddress, indexName) {
        const { body } = await this.client
            .search({
                index: indexName,
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        address: ethAddress.toUpperCase()
                                    }
                                },
                                {
                                    range: {
                                        createdAt: {
                                            gte: new Date(
                                                Date.now() - 24 * 60 * 60 * 1000
                                            )
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            })
            .catch(logger.error(`Error running searchAddress query`))
        return body
    }

    async searchTransaction(trxHash, indexName) {
        const { body } = await this.client
            .search({
                index: indexName,
                body: {
                    query: {
                        match: {
                            ethTrxHash: trxHash
                        }
                    }
                }
            })
            .catch(logger.error(`Error running searchTransaction query`))
        return body
    }

    async refresh(indexName) {
        await this.client.indices
            .refresh({
                index: indexName
            })
            .catch(logger.error(`Error refreshing index`))
    }
}

export default FaucetDb
