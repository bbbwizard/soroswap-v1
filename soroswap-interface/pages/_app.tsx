import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import TransactionToastProvider from '../providers/TransactionToastProvider'
import { Toaster } from 'react-hot-toast'
import StacksProvider from '../providers/StacksProvider'
import {
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
} from '@material-ui/core'
import { mainTheme } from '../utils/theme'
import React from 'react'

function ThemeProvider(props: React.PropsWithChildren) {
  const { children } = props
  const theme = mainTheme
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}

// soroswap is under development on testnet and is not yet audited.
function SoroswapApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <CssBaseline />
      <StacksProvider>
        <TransactionToastProvider>
          <Toaster position='bottom-right' />
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </TransactionToastProvider>
      </StacksProvider>
    </ThemeProvider>
  )
}

export default SoroswapApp
