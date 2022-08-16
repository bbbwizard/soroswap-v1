import { AuthOptions } from '@stacks/connect'

export const appDetails: AuthOptions['appDetails'] = {
  name: 'Soroswap',
  icon: 'https://e7.pngegg.com/pngimages/752/792/png-clipart-video-game-geeks-under-grace-a-way-out-george-soros-purple-game.png',
}

export const exchangeContractName = 'soroswap'
export const faucetContractName = 'faucet'
export const contractAddress = 'ST2Y6ZN7SSPTWTHKRR8X4FYWDM9NXR10038WWS576'
export const tokenContractAddress = 'ST2Y6ZN7SSPTWTHKRR8X4FYWDM9NXR10038WWS576'
export const pairContractAddress = 'ST2Y6ZN7SSPTWTHKRR8X4FYWDM9NXR10038WWS576'

// todo fetch from api service or chain rpc
export const tokens = [
  {
    id: 'token-1',
    name: 'STX',
    symbol: 'WSTX',
    displaySymbol: 'STX',
    logo: 'https://dynamic-assets.coinbase.com/000951bed6d9da0da8ca608655445b9ca0dc746783eed39029df4adda94b217dd0cff3607d3fe28aaa85ae556a55359ce6ce488a0f66c49ded01ec2e44549d56/asset_icons/4071fa869fa2fe84254afe04ccf4a21bb97b53cff988e4b8929009c2de6fae0c.png',
    contract: tokenContractAddress,
    decimals: 6,
    contractName: 'wstx',
  },
  {
    id: 'token-2',
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    contract: tokenContractAddress,
    contractName: 'wbtc',
    decimals: 8,
  },
  {
    id: 'token-3',
    name: 'Wrapped USDC',
    symbol: 'WUSDC',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    contract: tokenContractAddress,
    decimals: 6,
    contractName: 'wusdc',
  },
]

export const pairs = [
  {
    id: 'pair-1',
    name: 'WBTC-WSTX',
    contract: pairContractAddress,
    contractName: 'pair-wbtc-wstx',
    liquidityToken: 'wbtc-wstx-token',
    tokenX: 'wbtc',
    tokenY: 'wstx',
    decimals: 8,
  },
  {
    id: 'pair-2',
    name: 'WUSDC-WSTX',
    contract: pairContractAddress,
    contractName: 'pair-wusdc-wstx',
    liquidityToken: 'wusdc-wstx-token',
    tokenX: 'wusdc',
    tokenY: 'wstx',
    decimals: 8,
  },
  {
    id: 'pair-3',
    name: 'WBTC-WUSDC',
    contract: pairContractAddress,
    contractName: 'pair-wbtc-wusdc',
    liquidityToken: 'wbtc-wusdc-token',
    tokenX: 'wbtc',
    tokenY: 'wusdc',
    decimals: 8,
  },
]
