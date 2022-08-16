import React, { useState, useEffect } from 'react'
import { Box, Grid, CircularProgress } from '@material-ui/core'
import YourLiquidityPools from '../components/YourLiquidityPools'
import PoolCard from '../components/PoolCard'
import { fetchPairs } from '../lib/pairs'

export default function PoolPage() {
  const [loading, setLoading] = useState(false)
  const [pairs, setPairs] = useState([])

  useEffect(() => {
    const getPairs = async () => {
      const pairsRes = await fetchPairs()
      setPairs(pairsRes.data)
      setLoading(false)
    }
    setLoading(true)
    getPairs()
  }, [])

  return (
    <Box mb={3} id='pool-page'>
      <Grid
        direction='column'
        container
        spacing={4}
        justifyContent='center'
        alignItems='center'
      >
        <Grid item xs={12} sm={12} md={12}>
          <Box className='wrapper'>
            <YourLiquidityPools pairs={pairs} />
          </Box>
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <Box className='wrapper'>
            <p style={{ fontSize: 20, marginTop: 0, color: '#fff' }}>
              Liquidity Pools
            </p>
            {loading ? (
              <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : pairs.length ? (
              pairs.map((p, i) => {
                return <PoolCard index={i} pair={p} />
              })
            ) : (
              <Box>
                <p
                  style={{
                    border: '1px dashed rgb(86, 90, 105)',
                    color: 'rgb(86, 90, 105)',
                    padding: '12px',
                    textAlign: 'center',
                    borderRadius: '12px',
                  }}
                >
                  No Pools found.
                </p>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
