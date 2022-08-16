import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  makeStandardSTXPostCondition,
  makeStandardFungiblePostCondition,
  FungibleConditionCode,
  makeContractFungiblePostCondition,
  makeContractSTXPostCondition,
  createAssetInfo,
} from '@stacks/transactions'
import { contractAddress, exchangeContractName } from './constants'
import { network } from '../utils'
import { ContractCallRegularOptions } from '@stacks/connect-react'

function getPostConditions(
  address: string,
  amountSent: bigint,
  amountReceived: number,
  currencyX: any,
  currencyY: any
) {
  let postConditions = []
  if (currencyX.contractName === 'wstx') {
    postConditions.push(
      makeStandardSTXPostCondition(
        address,
        FungibleConditionCode.Equal,
        amountSent
      )
    )
  }
  postConditions.push(
    makeStandardFungiblePostCondition(
      address,
      FungibleConditionCode.Equal,
      amountSent,
      createAssetInfo(
        currencyX.contract,
        currencyX.contractName,
        currencyX.contractName
      )
    )
  )
  if (currencyY.contractName === 'wstx') {
    postConditions.push(
      makeContractSTXPostCondition(
        contractAddress,
        exchangeContractName,
        FungibleConditionCode.GreaterEqual,
        (
          parseFloat(`${amountReceived}`) * Math.pow(10, currencyY.decimals)
        ).toFixed(0)
      )
    )
    postConditions.push(
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.GreaterEqual,
        (
          parseFloat(`${amountReceived}`) * Math.pow(10, currencyY.decimals)
        ).toFixed(0),
        createAssetInfo(
          currencyY.contract,
          currencyY.contractName,
          currencyY.contractName
        )
      )
    )
  }
  postConditions.push(
    makeContractFungiblePostCondition(
      contractAddress,
      exchangeContractName,
      FungibleConditionCode.GreaterEqual,
      (
        parseFloat(`${amountReceived}`) * Math.pow(10, currencyY.decimals)
      ).toFixed(0),
      createAssetInfo(
        currencyY.contract,
        currencyY.contractName,
        currencyY.contractName
      )
    )
  )
  return postConditions
}

function buildSwapRequest(
  address: string,
  currency0: any,
  currency1: any,
  currency0Amount: number,
  minimumReceived: number,
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
  const amount = uintCV(currency0Amount * Math.pow(10, currency0.decimals))
  // if (inverse) {
  //   const _principalX = principalX
  //   principalX = principalY
  //   principalY = _principalX
  // }
  const minRec = uintCV(
    (
      parseFloat(`${minimumReceived}`) * Math.pow(10, currency1.decimals)
    ).toFixed(0)
  )
  const postConditions = getPostConditions(
    address || '',
    amount.value,
    minimumReceived,
    currency0,
    currency1
  )

  return {
    network,
    contractAddress,
    stxAddress: address,
    contractName: exchangeContractName,
    functionName: !inverse ? 'swap-x-for-y' : 'swap-y-for-x',
    functionArgs: [principalX, principalY, amount, minRec],
    onFinish,
    postConditions,
    anchorMode: AnchorMode.Any,
  }
}

export { getPostConditions, buildSwapRequest }
