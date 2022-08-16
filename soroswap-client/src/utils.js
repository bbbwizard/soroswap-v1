const { StacksMainnet, StacksTestnet, StacksMocknet } = require('@stacks/network')
require('dotenv').config()
const env = process.env.ENV
const network = resolveNetwork(env)
console.log(network.coreApiUrl)
async function checkingTxStatus(broadcastedResult, tx, count) {
  const url = `${network.coreApiUrl}/extended/v1/tx/${tx}`
  const result = await fetch(url)
  const value = await result.json()
  console.log(count)

  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`)
    console.log(value)
    return true
  } else if (value.tx_status === "pending") {
    console.log(value)
  } else if (value.error) {
    console.error(value.error)
  }

  if (count > 1200) {
    console.log("timeout")
    console.log(value)
    return false
  }

  setTimeout(function() {
    return checkingTxStatus(broadcastedResult, tx, count + 1)
  }, 1000)
}

function resolveNetwork(env) {
  if (env === 'mainnet') {
    const stacksNetwork = new StacksMainnet()
    return stacksNetwork
  } else if (env === 'testnet') {
    const stacksNetwork = new StacksTestnet()
    return stacksNetwork
  } else {
    console.log('use mocknet')
    const stacksNetwork = new StacksMocknet()
    return stacksNetwork
  }
}

async function getNonce(address) {
  const url = `${network.coreApiUrl}/v2/accounts/${address}?proof=0`
  const result = await fetch(url)
  const value = await result.json()
  return value.nonce
}

module.exports = {
  resolveNetwork,
  getNonce,
  checkingTxStatus,
  network,
}