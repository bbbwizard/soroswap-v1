require('dotenv').config()

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const privateKey = process.env.PRIVATE_KEY
const CONTRACT_NAME = 'faucet'
const tx = require('@stacks/transactions')
const BN = require('bn.js')
const utils = require('./utils')

const depositFaucet = async (currency, amount) => {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'deposit-faucet',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, currency),
      tx.uintCV(new BN(amount)),
    ],
    senderKey: privateKey,
    fee: new BN(250000, 10),
    postConditionMode: 1,
    network: utils.network,
  }
  const transaction = await tx.makeContractCall(txOptions)
  const result = tx.broadcastTransaction(transaction, utils.network)
  console.log(`checking txId: ${transaction.txid()}`)
  await utils.checkingTxStatus(result, transaction.txid(), 0)
}

(async () => {
  const [ , , currency, amount] = process.argv
  console.log(`deposit faucet for ${currency}: ${amount}`)
  await depositFaucet(currency, amount)
})()
