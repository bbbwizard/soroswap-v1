import React, { useState, useEffect } from 'react'
import { Box, Grid } from '@material-ui/core'
import AddLiquidity from '../../../components/AddLiquidity'

function AddLiquidityPage() {
  return (
    <Box mb={3} id='swap-page'>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={12} md={6} lg={5}>
          <Box className='wrapper'>
            <p style={{ fontSize: 20, marginTop: 0, color: '#fff' }}>
              Add Liquidity
            </p>
            <Box>
              <AddLiquidity />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AddLiquidityPage
