import {
  pairs,
  tokens,
  contractAddress,
  exchangeContractName,
} from './constants'
import {
  callReadOnlyFunction,
  cvToJSON,
  contractPrincipalCV,
} from '@stacks/transactions'
import { network } from '../utils'

// todo fetch from smart contract or api service
async function fetchPairs() {
  return {
    data: pairs,
  }
}

async function fetchPair(address: string, currency0, currency1) {
  const tx = await callReadOnlyFunction({
    contractAddress: contractAddress,
    contractName: exchangeContractName,
    functionName: 'get-pair',
    functionArgs: [
      contractPrincipalCV(currency0.contract, currency0.contractName),
      contractPrincipalCV(currency1.contract, currency1.contractName),
    ],
    network,
    senderAddress: address || '',
  })
  const json = cvToJSON(tx)
  if (json['success']) {
    return json['value']['value']['value']
  }
  return undefined
}

async function matchPair(address, currency0, currency1) {
  const contractName = `pair-${currency0?.contractName}-${currency1?.contractName}`
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i]
    if (pair.contractName === contractName) {
      const _pair = await fetchPair(address, currency0, currency1)
      return {
        ...pair,
        ..._pair,
      }
    }
  }
  return undefined
}

// 30bp factor
const _997_FACTOR = 0.997

// https://github.com/Uniswap/v2-sdk/blob/bda87ee3a00ad8a5508f15f1de414066a7df195f/src/entities/pair.ts#L116
function getOutputAmount(
  pair,
  currency0,
  currency1,
  currencyInputAmount: number | undefined,
  inverse: boolean
) {
  if (!pair?.['balance-x'] || !currencyInputAmount) {
    return {
      outputAmount: undefined,
    }
  }
  // inputAmountWithFee is not possible zero
  const inputAmountWithFee = Number(currencyInputAmount) * _997_FACTOR
  let _amount = 0
  let inputReserveQuotient = 0
  let outputReserveQuotient = 0
  if (inverse) {
    inputReserveQuotient =
      pair['balance-y'].value / Math.pow(10, currency0.decimals)
    outputReserveQuotient =
      pair['balance-x'].value / Math.pow(10, currency1.decimals)
  } else {
    inputReserveQuotient =
      pair['balance-x'].value / Math.pow(10, currency0.decimals)
    outputReserveQuotient =
      pair['balance-y'].value / Math.pow(10, currency1.decimals)
  }
  if (!inputReserveQuotient || !outputReserveQuotient) {
    return {
      outputAmount: undefined,
    }
  }
  // out * (x * fee) / (inp + (x * fee)) = y
  const denominator = inputReserveQuotient + inputAmountWithFee
  const numerator = outputReserveQuotient * inputAmountWithFee
  _amount = numerator / denominator
  return {
    outputAmount: _amount,
  }
}

// https://github.com/Uniswap/v2-sdk/blob/bda87ee3a00ad8a5508f15f1de414066a7df195f/src/entities/pair.ts#L129
function getInputAmount(
  pair,
  currency0,
  currency1,
  currencyOutputAmount: number | undefined,
  inverse: boolean
) {
  if (!pair?.['balance-x'] || !currencyOutputAmount) {
    return {
      inputAmount: undefined,
    }
  }

  let inputReserveQuotient = 0
  let outputReserveQuotient = 0
  if (inverse) {
    inputReserveQuotient =
      pair['balance-y'].value / Math.pow(10, currency0.decimals)
    outputReserveQuotient =
      pair['balance-x'].value / Math.pow(10, currency1.decimals)
  } else {
    inputReserveQuotient =
      pair['balance-x'].value / Math.pow(10, currency0.decimals)
    outputReserveQuotient =
      pair['balance-y'].value / Math.pow(10, currency1.decimals)
  }
  if (!inputReserveQuotient || !outputReserveQuotient) {
    return {
      inputAmount: undefined,
    }
  }
  // x = (y * inpRes) / (outRes - y) * fee
  const numerator = inputReserveQuotient * currencyOutputAmount
  const denominator =
    (outputReserveQuotient - currencyOutputAmount) * _997_FACTOR
  const inputAmount = numerator / denominator
  return {
    inputAmount,
  }
}

function getCurrencies(pair) {
  if (!pair) return []
  const currency0 = tokens.find((t) => t.contractName === pair.tokenX)
  const currency1 = tokens.find((t) => t.contractName === pair.tokenY)
  return [currency0, currency1]
}

export { fetchPairs, matchPair, getOutputAmount, getInputAmount, getCurrencies }
