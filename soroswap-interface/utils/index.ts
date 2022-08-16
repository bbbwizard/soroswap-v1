import { RPCClient } from '@stacks/rpc-client'
import { StacksMainnet, StacksTestnet, StacksMocknet } from '@stacks/network'
import { UserData } from '@stacks/auth'

export function shortenAddress(address: string, chars = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`
}

// testnet
const url = 'https://stacks-node-api.testnet.stacks.co'
// const url = 'http://localhost:3999'

export const getRpcClient = () => {
  return new RPCClient(network.coreApiUrl)
}
export const resolveAddress = (userData: UserData | undefined | null) => {
  // return userData?.profile?.stxAddress?.mainnet
  return userData?.profile?.stxAddress?.testnet
}

// new StacksMainnet({url})
// export const network = new StacksMainnet({ url: url })
export const network = new StacksTestnet({ url })
// export const network = new StacksMocknet()

export const microToReadable = (amount: number | string, decimals = 6) => {
  return parseFloat(`${amount}`) / Math.pow(10, decimals)
}

export function formatTokenAmount(
  amount?: number | undefined | null,
  decimals = 6
) {
  if (amount === null || amount === undefined) return '-'
  return microToReadable(amount, decimals)
}
