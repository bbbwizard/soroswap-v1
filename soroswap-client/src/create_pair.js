require('dotenv').config()

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS
const privateKey = process.env.PRIVATE_KEY
const CONTRACT_NAME = 'soroswap'

const tx = require('@stacks/transactions')
const BN = require('bn.js')
const utils = require('./utils')

const createPair = async (currency0, currency1, pairToken, name, x, y) => {
  const nonce = await utils.getNonce(CONTRACT_ADDRESS)

  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'create-pair',
    functionArgs: [
      tx.contractPrincipalCV(CONTRACT_ADDRESS, currency0),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, currency1),
      tx.contractPrincipalCV(CONTRACT_ADDRESS, pairToken),
      tx.stringAsciiCV(name),
      tx.uintCV(new BN(x, 10)),
      tx.uintCV(new BN(y, 10)),
    ],
    senderKey: privateKey,
    fee: new BN(250000, 10),
    postConditionMode: 0x1,
    network: utils.network,
    anchorMode: tx.AnchorMode.Any,
  }
  const transaction = await tx.makeContractCall(txOptions)
  const result = await tx.broadcastTransaction(transaction, utils.network)
  console.log(`checking txId: ${transaction.txid()}`)
  await utils.checkingTxStatus(result, transaction.txid(), 0)
}

(async () => {
  const [ , , currency0, currency1, pairToken, name, x, y] = process.argv
  console.log(`create pair for ${currency0} / ${currency1}`)
  await createPair(currency0, currency1, pairToken, name, x, y)
})()
