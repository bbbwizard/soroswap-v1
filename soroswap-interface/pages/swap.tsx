import React, { useState, useEffect } from 'react'
// import { useTheme } from '@material-ui/core/styles'
import { Box, Grid } from '@material-ui/core'
import Swap from '../components/Swap'

function SwapPanel() {
  return (
    <>
      <Box>
        <Swap />
      </Box>
    </>
  )
}

export default function SwapPage() {
  return (
    <Box mb={3} id='swap-page'>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={12} md={6} lg={5}>
          <Box className='wrapper'>
            <p style={{ fontSize: 20, marginTop: 0, color: '#fff' }}>Swap</p>
            <SwapPanel />
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
