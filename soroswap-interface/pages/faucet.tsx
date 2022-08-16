import React, { useState } from 'react'
import { Box, Grid, Button } from '@material-ui/core'
import { useStacks } from '../providers/StacksProvider'
import { useConnect } from '@stacks/connect-react'
import CurrencyInput from '../components/CurrencyInput'
import { tokens } from '../lib/constants'
import { buildMintRequest } from '../lib/faucet'
import { useTransactionToasts } from '../providers/TransactionToastProvider'

enum MintState {
  PENDING,
  OK,
  AMOUNT_ZERO,
  EXCEED_LIMIT,
}

function getMintButtonText(state) {
  switch (state) {
    case MintState.PENDING:
    default:
      return 'Select a token'
    case MintState.AMOUNT_ZERO:
      return 'Enter an amount'
    case MintState.EXCEED_LIMIT:
      return 'Exceed limit amount'
    case MintState.OK:
      return 'Mint'
  }
}

function isReachLimit(currency, amount) {
  if (currency.symbol === 'WBTC') {
    return amount > 5
  } else {
    return amount > 1000
  }
}

// todo only for testnet
export default function FaucetPage() {
  const { address, addPendingTransaction } = useStacks()
  const { doOpenAuth, doContractCall } = useConnect()
  const { addTransactionToast } = useTransactionToasts()
  const [currency0, setCurrency0] = useState(undefined)
  const [currency0Amount, setCurrency0Amount] = useState(undefined)
  const [mintState, setMintState] = useState(MintState.PENDING)
  const faucetTokens = Array.from(tokens).slice(1)
  const connectWallet = () => {
    doOpenAuth()
  }

  const onMint = async () => {
    if (!address || !currency0 || !currency0Amount) return
    const mintReq = buildMintRequest(
      address,
      currency0,
      currency0Amount,
      (data: any) => {
        console.log(data)
        const { txId } = data || {}
        addPendingTransaction(txId)
        addTransactionToast(txId, `Please wait a few moment`)
      }
    )
    await doContractCall(mintReq)
  }

  const handleCurrency0Input = (amount) => {
    if (!currency0) {
      setMintState(MintState.PENDING)
    } else if (!amount || amount === 0) {
      setMintState(MintState.AMOUNT_ZERO)
    } else if (isReachLimit(currency0, amount)) {
      setMintState(MintState.EXCEED_LIMIT)
    } else {
      setMintState(MintState.OK)
    }
    setCurrency0Amount(amount)
  }

  return (
    <Box mb={3} id='faucet-page'>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={12} md={6} lg={5}>
          <Box className='wrapper'>
            <p style={{ fontSize: 20, marginTop: 0, color: '#fff' }}>Faucet</p>
            <CurrencyInput
              title={`Input`}
              id='mint-currency-input'
              currency={currency0}
              handleCurrencySelect={setCurrency0}
              amount={currency0Amount}
              setAmount={handleCurrency0Input}
              tokenList={faucetTokens}
            />
            <Box className='faucet-button-wrapper'>
              <Button
                fullWidth
                disabled={address && mintState !== MintState.OK}
                onClick={address ? onMint : connectWallet}
              >
                <Box className='faucet-button-label'>
                  {address ? getMintButtonText(mintState) : 'Connect Wallet'}
                </Box>
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
