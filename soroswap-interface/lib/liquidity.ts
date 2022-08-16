import { contractAddress, exchangeContractName, tokens } from './constants'
import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  makeContractSTXPostCondition,
  makeContractFungiblePostCondition,
  FungibleConditionCode,
  createAssetInfo,
} from '@stacks/transactions'
import { network } from '../utils'
import { ContractCallRegularOptions } from '@stacks/connect-react'

function getPostConditions(
  address: string,
  amountX: bigint,
  amountY: bigint,
  currencyX: any,
  currencyY: any
) {
  const postConditions = []
  if (currencyX.contractName === 'wstx') {
    postConditions.push(
      makeStandardSTXPostCondition(
        address,
        FungibleConditionCode.Equal,
        amountX
      )
    )
    postConditions.push(
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.Equal,
        amountX,
        createAssetInfo(
          currencyX.contract,
          currencyX.contractName,
          currencyX.contractName
        )
      )
    )
  } else {
    postConditions.push(
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.LessEqual,
        amountX,
        createAssetInfo(
          currencyX.contract,
          currencyX.contractName,
          currencyX.contractName
        )
      )
    )
  }

  if (currencyY.contractName === 'wstx') {
    postConditions.push(
      makeStandardSTXPostCondition(
        address,
        FungibleConditionCode.Equal,
        amountY
      )
    )
    postConditions.push(
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.Equal,
        amountY,
        createAssetInfo(
          currencyY.contract,
          currencyY.contractName,
          currencyY.contractName
        )
      )
    )
  } else {
    postConditions.push(
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.LessEqual,
        amountY,
        createAssetInfo(
          currencyY.contract,
          currencyY.contractName,
          currencyY.contractName
        )
      )
    )
  }
  return postConditions
}

function buildAddLiquidityRequest(
  address: string,
  currency0: any,
  currency1: any,
  pair: any,
  currency0Amount: number,
  currency1Amount: number,
  inverse: boolean,
  onFinish: (data: any) => void = () => {}
): ContractCallRegularOptions {
  let principalX = contractPrincipalCV(
    currency0.contract,
    currency0.contractName
  )
  let principalY = contractPrincipalCV(
    currency1.contract,
    currency1.contractName
  )
  let amountX = uintCV(
    parseInt(`${currency0Amount * Math.pow(10, currency0.decimals)}`, 10)
  )
  let amountY = uintCV(
    parseInt(`${currency1Amount * Math.pow(10, currency1.decimals)}`, 10)
  )
  if (inverse) {
    const _principalX = principalX
    principalX = principalY
    principalY = _principalX

    const _amountX = amountX
    amountX = amountY
    amountY = _amountX
  }
  const principalPair = contractPrincipalCV(pair.contract, pair.contractName)
  const postConditions = getPostConditions(
    address,
    amountX.value,
    amountY.value,
    currency0,
    currency1
  )
  return {
    network,
    contractAddress,
    stxAddress: address,
    contractName: exchangeContractName,
    functionName: 'add-to-position',
    functionArgs: [principalX, principalY, principalPair, amountX, amountY],
    onFinish,
    postConditions,
    anchorMode: AnchorMode.Any,
  }
}

function getRemoveLiquidityPostConditions(
  address: string,
  currency0,
  currency1,
  pair,
  lpBalance: number,
  percentage: number
) {
  const postConditions = []

  if (currency0.contractName === 'wstx') {
    postConditions.push(
      makeContractSTXPostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        0
      )
    )
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(
          currency0.contract,
          currency0.contractName,
          currency0.contractName
        )
      )
    )
  } else {
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(
          currency0.contract,
          currency0.contractName,
          currency0.contractName
        )
      )
    )
  }
  if (currency1.contractName === 'wstx') {
    postConditions.push(
      makeContractSTXPostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        0
      )
    )
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(
          currency1.contract,
          currency1.contractName,
          currency1.contractName
        )
      )
    )
  } else {
    postConditions.push(
      makeContractFungiblePostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        0,
        createAssetInfo(
          currency1.contract,
          currency1.contractName,
          currency1.contractName
        )
      )
    )
  }
  postConditions.push(
    makeStandardFungiblePostCondition(
      address,
      FungibleConditionCode.LessEqual,
      uintCV(parseInt(`${(lpBalance / 100) * (percentage + 5)}`, 10)).value,
      createAssetInfo(pair.contract, pair.contractName, pair.liquidityToken)
    )
  )
  return postConditions
}

function buildRemoveLiquidityRequest(
  address: string,
  currency0: any,
  currency1: any,
  pair: any,
  percentage: number,
  lpBalance: number,
  inverse: boolean,
  onFinish: (data: any) => void = () => {}
): ContractCallRegularOptions {
  let principalX = contractPrincipalCV(
    currency0.contract,
    currency0.contractName
  )
  let principalY = contractPrincipalCV(
    currency1.contract,
    currency1.contractName
  )
  if (inverse) {
    const _principalX = principalX
    principalX = principalY
    principalY = _principalX
  }
  const principalPair = contractPrincipalCV(pair.contract, pair.contractName)
  const balance = lpBalance * Math.pow(10, pair.decimals || 8)
  const postConditions = getRemoveLiquidityPostConditions(
    address,
    currency0,
    currency1,
    pair,
    +balance,
    percentage
  )
  const percentageToRemove = uintCV(percentage)
  return {
    network,
    contractAddress,
    stxAddress: address,
    contractName: exchangeContractName,
    functionName: 'reduce-position',
    functionArgs: [principalX, principalY, principalPair, percentageToRemove],
    onFinish,
    postConditions,
    // postConditionMode: 0x1,
    anchorMode: AnchorMode.Any,
  }
}

function getOutputAmount(
  pair,
  currency0,
  currency1,
  currencyInputAmount: number | undefined,
  inverse: boolean
) {
  if (!pair?.['shares-total'] || !currencyInputAmount) {
    return {
      outputAmount: undefined,
    }
  }
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
  const numerator = outputReserveQuotient * currencyInputAmount
  const denominator = inputReserveQuotient
  _amount = numerator / denominator
  return {
    outputAmount: _amount,
  }
}

function getInputAmount(
  pair,
  currency0,
  currency1,
  currencyOutputAmount: number | undefined,
  inverse: boolean
) {
  if (!pair?.['shares-total'] || !currencyOutputAmount) {
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
  const numerator = inputReserveQuotient * currencyOutputAmount
  const denominator = outputReserveQuotient
  const inputAmount = numerator / denominator
  return {
    inputAmount,
  }
}

// simplify the calculation: https://github.com/Uniswap/v2-sdk/blob/bda87ee3a00ad8a5508f15f1de414066a7df195f/src/entities/pair.ts#L168
function getLiquidityMinted(
  pair,
  currency0,
  currency1,
  currency0Amount: number | undefined,
  currency1Amount: number | undefined,
  inverse: boolean
): number | undefined {
  if (!pair?.['shares-total'] || !currency1Amount || !currency0Amount) {
    return undefined
  }
  let reserve0Quotient = 0
  let reserve1Quotient = 0
  if (inverse) {
    reserve0Quotient =
      pair['balance-x'].value / Math.pow(10, currency1.decimals)
    reserve1Quotient =
      pair['balance-y'].value / Math.pow(10, currency0.decimals)
  } else {
    reserve0Quotient =
      pair['balance-x'].value / Math.pow(10, currency0.decimals)
    reserve1Quotient =
      pair['balance-y'].value / Math.pow(10, currency1.decimals)
  }
  const totalSupply =
    pair['shares-total'].value / Math.pow(10, pair.decimals || 8)
  const amount0 = (currency0Amount * totalSupply) / reserve0Quotient
  const amount1 = (currency1Amount * totalSupply) / reserve1Quotient
  if (amount0 > amount1) {
    return amount1
  }
  return amount0
}

function getPoolTokenPercentage(pair, liquidityMinted: number | undefined) {
  if (!liquidityMinted) return 0
  const totalSupply =
    pair['shares-total'].value / Math.pow(10, pair.decimals || 8)
  return (liquidityMinted / (totalSupply + liquidityMinted)) * 100
}

function useCurrency(contractName) {
  if (!contractName) return undefined
  const currency = tokens.find((t) => t.contractName === contractName)
  return currency
}

export {
  useCurrency,
  buildAddLiquidityRequest,
  buildRemoveLiquidityRequest,
  getOutputAmount,
  getInputAmount,
  getLiquidityMinted,
  getPoolTokenPercentage,
}
