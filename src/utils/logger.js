import debug from 'debug'

export default {
    info: debug('faucet:info'),
    debug: debug('faucet:debug'),
    log: debug('faucet:log'),
    error: debug('faucet:error')
}
