export default {
    env: process.env.NODE_ENV || 'development',
    server: {
        port: process.env.SERVER_PORT || 3001,
        faucetEth: process.env.FAUCET_ETH || 3,
        faucetTimeSpan: process.env.FAUCET_TIMESPAN || 24,
        faucetNode: process.env.FAUCET_NODE || 'http://localhost:8545',
        faucetGas: process.env.FAUCET_GAS || '21000',
        privateKey: process.env.FAUCET_PRIVATE_KEY || '878b0bb351b9aa89a18aae4b910839611980eae2aaec160abaa042f975ea81c5'
    },
    database: {
        uri: process.env.ELASTIC_URL || 'http://localhost:9200',
        user: process.env.ELASTIC_USER || 'elastic',
        password: process.env.ELASTIC_PASSWORD || 'changeme',
        index: process.env.ELASTIC_INDEX || 'faucetdb'
    }
}
