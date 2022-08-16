import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Box, Button } from '@material-ui/core'
import { useStacks } from '../../providers/StacksProvider'
// import { showConnect } from '@stacks/connect'
import { useConnect } from '@stacks/connect-react'
import CurrencyInput from '../CurrencyInput'
import { matchPair, getOutputAmount, getInputAmount } from '../../lib/pairs'
import { buildSwapRequest } from '../../lib/swap'
import { useTransactionToasts } from '../../providers/TransactionToastProvider'
import styles from './Swap.module.scss'

enum SwapState {
  PENDING,
  OK,
  INSUFFICIENT_LIQUIDITY,
  INSUFFICIENT_BALANCE,
}

function getSwapButtonText(state) {
  switch (state) {
    case SwapState.PENDING:
    default:
      return 'Enter an amount'
    case SwapState.OK:
      return 'Swap'
    case SwapState.INSUFFICIENT_LIQUIDITY:
      return 'Insufficient liquidity for this trade'
    case SwapState.INSUFFICIENT_BALANCE:
      return 'Insufficient balance'
  }
}

function Swap() {
  const { address, balances, slippageTolerance, addPendingTransaction } =
    useStacks()
  const { doContractCall, doOpenAuth } = useConnect()
  const { addTransactionToast } = useTransactionToasts()

  const [currency0, setCurrency0] = useState<any>()
  const [currency1, setCurrency1] = useState<any>()
  const [currency0Amount, setCurrency0Amount] = useState<number | undefined>(
    undefined
  )
  const [currency1Amount, setCurrency1Amount] = useState<number | undefined>(
    undefined
  )
  const [currentPair, setCurrentPair] = useState<any>()
  const [inverse, setInverse] = useState(false)
  const [swapState, setSwapState] = useState(SwapState.PENDING)
  const [priceSwitch, setPriceSwitch] = useState(false)

  useEffect(() => {
    async function resolvePair() {
      if (!currency0 || !currency1) {
        setCurrentPair(undefined)
        return
      }
      let pair = await matchPair(address, currency0, currency1)
      if (!pair) {
        pair = await matchPair(address, currency1, currency0)
        if (pair) {
          setInverse(true)
        }
      } else {
        setInverse(false)
      }
      if (!pair?.['shares-total']) {
        setCurrentPair(undefined)
        setSwapState(SwapState.INSUFFICIENT_LIQUIDITY)
        return
      } else {
        setCurrentPair(pair)
        setSwapState(SwapState.PENDING)
      }
    }
    resolvePair()
    console.log('resolve')
  }, [address, currency0, currency1])

  const connectWallet = () => {
    doOpenAuth()
  }

  const onSwap = async () => {
    const slippage = (100 - slippageTolerance) / 100
    const minimumReceived = currency1Amount * slippage
    const swapReq = buildSwapRequest(
      address || '',
      currency0,
      currency1,
      currency0Amount,
      minimumReceived,
      inverse,
      (data: any) => {
        console.log(data)
        const { txId } = data || {}
        addPendingTransaction(txId)
        addTransactionToast(txId, `please wait a few moment...`)
      }
    )
    await doContractCall(swapReq)
  }

  const handleMaxInput = () => {
    const userCurrency0BalanceX = balances?.[currency0.contractName] || 0
    if (!userCurrency0BalanceX) return
    setCurrency0Amount(userCurrency0BalanceX)
    calculateCurrency1Amount(userCurrency0BalanceX)
  }

  const handleCurrency0Select = (currency) => {
    if (currency.symbol === currency1?.symbol) {
      setCurrency1(null)
      setCurrency1Amount(null)
    }
    setCurrency0(currency)
  }

  const handleCurrency1Select = (currency) => {
    if (currency.symbol === currency0?.symbol) {
      setCurrency0(null)
      setCurrency0Amount(null)
    }
    setCurrency1(currency)
  }

  const handleCurrency0Input = (amount) => {
    setCurrency0Amount(amount)
    // calculate currency1 amount
    calculateCurrency1Amount(amount)
  }

  const handleCurrency1Input = (amount) => {
    setCurrency1Amount(amount)
    // calculate currency0 amount
    calculateCurrency0Amount(amount)
  }

  const calculateCurrency1Amount = (currency0Amount: number | undefined) => {
    const { outputAmount } = getOutputAmount(
      currentPair,
      currency0,
      currency1,
      +currency0Amount,
      inverse
    )
    if (!outputAmount) {
      setCurrency1Amount(undefined)
      return
    }
    setCurrency1Amount(outputAmount)

    const userCurrency0BalanceX = balances?.[currency0.contractName] || 0
    if (
      currency0Amount * Math.pow(10, currency0.decimals) >
      userCurrency0BalanceX
    ) {
      setSwapState(SwapState.INSUFFICIENT_BALANCE)
    } else {
      setSwapState(SwapState.OK)
    }
  }

  const calculateCurrency0Amount = (currency1Amount: number | undefined) => {
    const { inputAmount } = getInputAmount(
      currentPair,
      currency0,
      currency1,
      +currency1Amount,
      inverse
    )
    if (!inputAmount) {
      setCurrency0Amount(undefined)
      return
    }
    setCurrency0Amount(inputAmount)

    const userCurrency0BalanceX = balances?.[currency0.contractName] || 0
    if (
      inputAmount * Math.pow(10, currency0.decimals) >
      userCurrency0BalanceX
    ) {
      setSwapState(SwapState.INSUFFICIENT_BALANCE)
    } else {
      setSwapState(SwapState.OK)
    }
  }

  const onSwitchCurrencies = () => {
    const _currency0 = { ...currency0 }
    setCurrency0({ ...currency1 })
    setCurrency1(_currency0)
    const _currencyAmount0 = currency0Amount
    setCurrency0Amount(currency1Amount)
    setCurrency1Amount(_currencyAmount0)
  }

  const getSwapPriceInfo = () => {
    if (!currency1Amount || !currency0Amount) return '-'
    let _amount1 = currency1Amount
    let _amount0 = currency0Amount
    let left = currency0
    let right = currency1
    if (priceSwitch) {
      let temp = _amount0
      _amount0 = _amount1
      _amount1 = temp

      let _left = left
      left = right
      right = _left
    }
    const price = (_amount1 / _amount0).toFixed(3)
    return `1 ${left.symbol} =  ${price || '-'} ${right.symbol}`
  }

  const onPriceSwitch = () => {
    setPriceSwitch(!priceSwitch)
  }

  return (
    <Box>
      <CurrencyInput
        title={`From`}
        id='swap-currency-input'
        currency={currency0}
        onMax={handleMaxInput}
        handleCurrencySelect={handleCurrency0Select}
        amount={currency0Amount}
        setAmount={handleCurrency0Input}
      />
      <Box className={styles.exchangeSwap}>
        <div onClick={onSwitchCurrencies}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='#C3C5CB'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='12' y1='5' x2='12' y2='19'></line>
            <polyline points='19 12 12 19 5 12'></polyline>
          </svg>
        </div>
      </Box>
      <CurrencyInput
        title={`To (estimate)`}
        id='swap-currency-output'
        currency={currency1}
        handleCurrencySelect={handleCurrency1Select}
        amount={currency1Amount}
        setAmount={handleCurrency1Input}
      />

      <Box style={{ height: 12 }}></Box>
      {currency0 && currency1 && currency0Amount && currency1Amount ? (
        <Box className={styles.swapPriceWrapper}>
          <Box className={styles.swapPriceLabel}>Price</Box>
          <Box className={styles.swapPriceContent}>
            <Box className={styles.swapPrice}>{getSwapPriceInfo()}</Box>
            <Box className={styles.swapPriceSwitchIcon} onClick={onPriceSwitch}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='14'
                height='14'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <polyline points='17 1 21 5 17 9'></polyline>
                <path d='M3 11V9a4 4 0 0 1 4-4h14'></path>
                <polyline points='7 23 3 19 7 15'></polyline>
                <path d='M21 13v2a4 4 0 0 1-4 4H3'></path>
              </svg>
            </Box>
          </Box>
        </Box>
      ) : null}

      <Box className={styles.swapButtonWrapper}>
        <Box style={{ width: '100%' }}>
          <Button
            fullWidth
            disabled={address && swapState !== SwapState.OK}
            onClick={address ? onSwap : connectWallet}
          >
            <div className={styles.swapButtonLabel}>
              {address ? getSwapButtonText(swapState) : 'Connect Wallet'}
            </div>
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default Swap
