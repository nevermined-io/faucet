import path from 'path'
import chai from 'chai'
import chaiHttp from 'chai-http'
import mockedEnv from 'mocked-env'
import FaucetDb from '../src/models/db'

// import decache from 'decache'

require('dotenv').config({
    path: path.join(__dirname, '/.env.test')
})
import config from '../src/config'

chai.use(chaiHttp)

const app = require('../src/server').default
const faucetDb = new FaucetDb(config)

const { expect } = chai
let restore

describe('Test: GET /', () => {
    it('should return HTML by default', (done) => {
        chai.request(app)
            .get('/')
            .end((err, res) => {
                expect(err).to.equal(null)
                expect(res).to.have.status(200)
                expect(res.text).not.equal(null)
                expect(res.text).include('<strong><code>')
                done()
            })
    })

    it('should return JSON when requested', (done) => {
        chai.request(app)
            .get('/')
            .set('Content-Type', 'application/json')
            .end((err, res) => {
                expect(err).to.equal(null)
                expect(res).to.have.status(200)
                expect(res.body).not.equal(null)
                expect(res.body.software).not.equal(null)
                done()
            })
    })
})

describe('Test: POST /faucet', () => {
    before(() => {
        restore = mockedEnv({
            ADDRESS: '0x00bd138abd70e2f00903268f3db08f2d25677c9e',
            NODE_ENV: 'test'
        })
    })

    beforeEach(async function () {
        if (faucetDb.indexExists(config.database.index)) {
            console.log(`Deleting documents from index`)
            await faucetDb.deleteIndexDocuments(config.database.index)
            console.log(`Deleted documents!`)
        }
    })

    it('should not POST without an address', (done) => {
        const req = {
            address: ''
        }
        chai.request(app)
            .post('/faucet')
            .send(req)
            .end((err, res) => {
                expect(err).to.equal(null)
                expect(res).to.have.status(400)
                expect(res.body).not.equal(null)
                expect(res.body.errors).not.equal(null)
                expect(res.body.errors).to.have.lengthOf.at.least(1)
                expect(res.body.errors[0].msg).to.eql(
                    'Invalid Ethereum address'
                )
                done()
            })
    })

    it('should not POST with an invalid address', (done) => {
        const req = {
            address: 'invalidaddress'
        }
        chai.request(app)
            .post('/faucet')
            .send(req)
            .end((err, res) => {
                expect(err).to.equal(null)
                expect(res).to.have.status(400)
                expect(res.body).not.equal(null)
                expect(res.body.errors).not.equal(null)
                expect(res.body.errors).to.have.lengthOf.at.least(1)
                expect(res.body.errors[0].msg).to.eql(
                    'Invalid Ethereum address'
                )
                done()
            })
    })

    it('should send 3 ETH', (done) => {
        const req = {
            address: '0x1F08a98e53b2bDd0E6aE8E1140017e26E935780D'
        }

        chai.request(app)
            .post('/faucet')
            .send(req)
            .then((res) => {
                expect(res).to.have.status(201)
                expect(res.body).to.not.be.null // eslint-disable-line no-unused-expressions
                expect(res.body.success).to.eql(true)
                expect(res.body.record).to.not.be.null // eslint-disable-line no-unused-expressions
                done()
            })
            .catch(done)
    })

    it('should not be able to requets tokens in less than 24 hours', (done) => {
        const req = {
            address: '0x1F08a98e53b2bDd0E6aE8E1140017e26E935780D'
        }
        chai.request(app)
            .post('/faucet')
            .send(req)
            .end((err, res) => {
                expect(err).to.equal(null)
                expect(res.body).not.equal(null)
                expect(res).to.have.status(201)
                chai.request(app)
                    .post('/faucet')
                    .send(req)
                    .end((err, res) => {
                        expect(err).to.equal(null)
                        expect(res.body).not.equal(null)
                        expect(res.body.success).to.eql(false)
                        expect(res.body.message).to.include(
                            'Already requested. You can request again in'
                        )
                        expect(res).to.have.status(500)
                        done()
                    })
            })
    })

    it('should not be able to find a transaction for an existing request', (done) => {
        const req = {
            address: '0x1F08a98e53b2bDd0E6aE8E1140017e26E935780D'
        }
        let trxHash = ''
        chai.request(app)
            .post('/faucet')
            .send(req)
            .end((err, res) => {
                expect(err).to.equal(null)
                expect(res.body).not.equal(null)
                expect(res.body.success).to.eql(true)
                expect(res).to.have.status(201)
                trxHash = res.body.trxHash
                done()
            })

        chai.request(app)
            .get(`/trxhash?id=${trxHash}`)
            .end((err, res) => {
                res.should.have.status(200)
                done()
            })
    })

    after(() => {
        restore()
    })
})
