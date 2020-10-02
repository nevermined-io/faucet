const pino = require('pino')
const logger = pino({
    level: process.env.LOG_LEVEL || 'debug',
    prettyPrint: { colorize: true }
})

export default logger
// export default {
//     info: debug('faucet:info'),
//     debug: debug('faucet:debug'),
//     log: debug('faucet:log'),
//     error: debug('faucet:error')
// }
