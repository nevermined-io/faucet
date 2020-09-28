export default {
    env: process.env.NODE_ENV || 'development',
    server: {
        port: process.env.SERVER_PORT || 3001,
        faucetEth: process.env.FAUCET_ETH || 3,
        faucetTimeSpan: process.env.FAUCET_TIMESPAN || 24,
        faucetAddress:
            process.env.FAUCET_ADDRESS ||
            '0x00Bd138aBD70e2F00903268F3Db08f2D25677C9e',
        faucetPassword: process.env.FAUCET_PASSWORD || 'node0',
        faucetNode: process.env.FAUCET_NODE || 'http://localhost:8545',
        faucetGas: process.env.FAUCET_GAS || '21000',
        faucetGasPrice: process.env.FAUCET_GASPRICE || '1'
    },
    database: {
        uri: process.env.ELASTIC_URL || 'http://localhost:9201',
        user: process.env.ELASTIC_USER || 'elastic',
        password: process.env.ELASTIC_PASSWORD || 'changeme',
        index: process.env.ELASTIC_INDEX || 'faucetdb'
    }
}
