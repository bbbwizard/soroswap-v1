import {
  AnchorMode,
  contractPrincipalCV,
  uintCV,
  standardPrincipalCV,
} from '@stacks/transactions'
import { ContractCallRegularOptions } from '@stacks/connect-react'
import { contractAddress, faucetContractName } from './constants'
import { network } from '../utils'

function buildMintRequest(
  address,
  currency,
  amount: number,
  onFinish = (data: any) => {}
): ContractCallRegularOptions {
  const postConditions = []
  return {
    network,
    contractAddress,
    stxAddress: address,
    contractName: faucetContractName,
    functionName: 'get-faucet-token',
    functionArgs: [
      standardPrincipalCV(address),
      contractPrincipalCV(currency.contract, currency.contractName),
      uintCV(amount * Math.pow(10, currency.decimals)),
    ],
    onFinish,
    postConditionMode: 1,
    postConditions,
    anchorMode: AnchorMode.Any,
  }
}

export { buildMintRequest }
