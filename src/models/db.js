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
        return this.client.indices.exists({
            index: indexName
        })
    }

    async createIndex(indexName) {
        logger.log(`Creating index ${indexName}`)
        return this.client.indices
            .create({ index: indexName })
            .catch()
            .then(logger.log(`Index created ${indexName}`))
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
            .catch()
    }

    async ping() {
        this.client.ping().then(logger.log(`Ping returned`))
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
            .catch()
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
        const { body } = await this.client.search({
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
        return body
    }

    async refresh(indexName) {
        this.client.indices.refresh({
            index: indexName
        })
    }
}

export default FaucetDb
