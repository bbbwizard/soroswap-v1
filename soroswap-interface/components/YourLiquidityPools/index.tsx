import React, { useEffect, useState } from 'react'
import { Box, Button } from '@material-ui/core'
import styles from './YourLiquidityPools.module.scss'
import { useStacks } from '../../providers/StacksProvider'
import { useConnect } from '@stacks/connect-react'
import PoolCard from '../PoolWithLiquidityCard'

const YourLiquidityPools: React.FC<any> = (props: { pairs?: any }) => {
  const { address, balances } = useStacks()
  const { pairs } = props || {}
  const { doOpenAuth } = useConnect()
  const [allPairsWithLiquidity, setAllPairsWithLiquidity] = useState([])

  const connectWallet = () => {
    doOpenAuth()
  }

  useEffect(() => {
    if (!pairs?.length || !balances || !Object.keys(balances)?.length) return
    const _pairs = []
    for (const pIndex in pairs) {
      const pair = pairs[pIndex]
      if (balances[pair.liquidityToken] > 0) {
        _pairs.push(pair)
      }
    }
    setAllPairsWithLiquidity(_pairs)
  }, [pairs, balances])

  return (
    <>
      <p className={styles.yourLiqTitle}>Your Liquidity Pools</p>
      {!address ? (
        <>
          <p className={styles.connectWalletHint}>
            Connect your wallet to provide liquidity.
          </p>
          <Box className={styles.connectWalletButton}>
            <Button fullWidth onClick={connectWallet}>
              <div className={styles.connectWalletButtonLabel}>
                Connect Wallet
              </div>
            </Button>
          </Box>
        </>
      ) : (
        <Box mt={3}>
          {allPairsWithLiquidity?.length ? (
            <Box>
              {allPairsWithLiquidity.map((pair, ind) => (
                <PoolCard index={ind} pair={pair} />
              ))}
            </Box>
          ) : (
            <Box textAlign='center' className=''>
              No liquidity found.
            </Box>
          )}
        </Box>
      )}
    </>
  )
}

export default YourLiquidityPools
