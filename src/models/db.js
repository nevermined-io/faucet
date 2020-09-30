import config from '../config'
import logger from '../utils/logger'
const { Client } = require('@elastic/elasticsearch')

class FaucetDb {
    constructor(config) {
        this.client = new Client({
            node: config.database.uri,
            auth: {
                username: config.database.username,
                password: config.database.password
            },
            maxRetries: 5,
            requestTimeout: 60000
        })
        try {
            if (!this.indexExists(config.database.index)) {
                this.createIndex(config.database.index).then(
                    this.initMapping(config.database.index)
                )
            }
        } catch (error) {
            logger.error(error)
        }
    }

    indexExists(indexName) {
        return this.client.indices
            .exists({
                index: indexName
            })
            .catch(logger.error(`Error checking index`))
    }

    async createIndex(indexName) {
        logger.log(`Creating index ${indexName}`)
        return this.client.indices
            .create({ index: indexName })
            .then(logger.log(`Index created ${indexName}`))
            .catch(logger.error(`Error creating index ${indexName}`))
    }

    initMapping(indexName) {
        return this.client.indices
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
            .catch(logger.error(`Error setting mapping to index ${indexName}`))
    }

    async ping() {
        this.client
            .ping()
            .then(logger.debug(`Ping returned`))
            .catch(logger.error(`Unable to contact Elastic server`))
    }

    deleteIndexDocuments(indexName) {
        this.client
            .deleteByQuery({
                index: indexName,
                refresh: true,
                body: {
                    query: {
                        match_all: {}
                    }
                }
            })
            .catch(logger.error(`Error deleting documents`))
    }

    async index(ethAddress, faucetEth, hash, agent) {
        this.client.index(
            {
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
            },
            function (err, resp, status) {
                logger.error(`Error: ${resp}`)
            }
        )
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

    async refresh(indexName) {
        this.client.indices
            .refresh({
                index: indexName
            })
            .catch(logger.error(`Error refreshing index`))
    }
}

export default FaucetDb
