import { network } from '../utils'
import { tokenContractAddress } from './constants'

export const getBalance = async (address: string) => {
  const url = `${network.coreApiUrl}/extended/v1/address/${address}/balances`
  console.log('fetching balances')
  const response = await fetch(url)
  const data = await response.json()
  const contractAddress = tokenContractAddress

  const wbtcBalance = data.fungible_tokens[`${contractAddress}.wbtc::wbtc`]
  const wusdcBalance = data.fungible_tokens[`${contractAddress}.wusdc::wusdc`]
  const lpStxWusdcBalance =
    data.fungible_tokens[`${contractAddress}.pair-wusdc-wstx::wusdc-wstx-token`]
  const lpStxWbtcBalance =
    data.fungible_tokens[`${contractAddress}.pair-wbtc-wstx::wbtc-wstx-token`]
  const lpWbtcWUsdcBalance =
    data.fungible_tokens[`${contractAddress}.pair-wbtc-wusdc::wbtc-wusdc-token`]
  console.warn(data)
  return {
    wstx: Number(data.stx.balance) - Number(data.stx.locked),
    wbtc: wbtcBalance ? wbtcBalance.balance : 0,
    wusdc: wusdcBalance ? wusdcBalance.balance : 0,
    'wusdc-wstx-token': lpStxWusdcBalance ? lpStxWusdcBalance.balance : 0,
    'wbtc-wstx-token': lpStxWbtcBalance ? lpStxWbtcBalance.balance : 0,
    'wbtc-wusdc-token': lpWbtcWUsdcBalance ? lpWbtcWUsdcBalance.balance : 0,
  }
}
