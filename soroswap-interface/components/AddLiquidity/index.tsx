import React, { useState, useEffect } from 'react'
import { Box, Button } from '@material-ui/core'
import { useRouter } from 'next/router'
import { useStacks } from '../../providers/StacksProvider'
import { useConnect } from '@stacks/connect-react'
import CurrencyInput from '../CurrencyInput'
import { matchPair } from '../../lib/pairs'
import {
  buildAddLiquidityRequest,
  useCurrency,
  getOutputAmount,
  getInputAmount,
  getPoolTokenPercentage,
  getLiquidityMinted,
} from '../../lib/liquidity'
// import { formatTokenAmount } from '../../utils'
import { useTransactionToasts } from '../../providers/TransactionToastProvider'
import styles from './AddLiquidity.module.scss'

enum AddLiquidityState {
  PENDING,
  OK,
  INSUFFICIENT_LIQUIDITY,
  INSUFFICIENT_BALANCE,
}

function getAddLiquidityButtonText(state) {
  switch (state) {
    case AddLiquidityState.PENDING:
    default:
      return 'Enter an amount'
    case AddLiquidityState.OK:
      return 'Supply'
    case AddLiquidityState.INSUFFICIENT_LIQUIDITY:
      return 'Insufficient pair'
    case AddLiquidityState.INSUFFICIENT_BALANCE:
      return 'Insufficient balance'
  }
}

function AddLiquidity() {
  const router = useRouter()
  const { addTransactionToast } = useTransactionToasts()
  const { currency0: currency0ContractName, currency1: currency1ContractName } =
    router.query

  const { address, balances, addPendingTransaction } = useStacks()
  const { doContractCall, doOpenAuth } = useConnect()
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
  const [liquidityState, setLiquidityState] = useState(
    AddLiquidityState.PENDING
  )

  useEffect(() => {
    if (currency0ContractName && currency1ContractName) {
      setCurrency0(useCurrency(currency0ContractName))
      setCurrency1(useCurrency(currency1ContractName))
    }
  }, [currency0ContractName, currency1ContractName])

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
      console.log(pair)
      if (!pair?.['shares-total']) {
        setCurrentPair(undefined)
        setLiquidityState(AddLiquidityState.INSUFFICIENT_LIQUIDITY)
        return
      } else {
        setCurrentPair(pair)
        setLiquidityState(AddLiquidityState.PENDING)
      }
    }
    resolvePair()
  }, [address, currency0, currency1])

  const connectWallet = () => {
    doOpenAuth()
  }

  const onAdd = async () => {
    const swapReq = buildAddLiquidityRequest(
      address || '',
      currency0,
      currency1,
      currentPair,
      currency0Amount,
      currency1Amount,
      inverse,
      (data: any) => {
        console.log(data)
        const { txId } = data || {}
        addPendingTransaction(txId)
        addTransactionToast(
          txId,
          `Providing liquidity, please wait a few moment...`
        )
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
      currency0Amount,
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
      setLiquidityState(AddLiquidityState.INSUFFICIENT_BALANCE)
    } else {
      setLiquidityState(AddLiquidityState.OK)
    }
  }

  const calculateCurrency0Amount = (currency1Amount: number | undefined) => {
    const { inputAmount } = getInputAmount(
      currentPair,
      currency0,
      currency1,
      currency1Amount,
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
      setLiquidityState(AddLiquidityState.INSUFFICIENT_BALANCE)
    } else {
      setLiquidityState(AddLiquidityState.OK)
    }
  }

  const onSwitchCurrencies = () => {
    const _currency0 = currency0
    setCurrency0(currency1)
    setCurrency1(_currency0)
    const _currencyAmount0 = currency0Amount
    setCurrency0Amount(currency1Amount)
    setCurrency1Amount(_currencyAmount0)
  }

  const formatPriceExchangeInfo = () => {
    if (!currency1Amount || !currency0Amount)
      return `1 ${currency0.symbol} = - ${currency1.symbol} `
    const price = (currency1Amount / currency0Amount).toFixed(3)
    return `1 ${currency0.symbol} = ${price} ${currency1.symbol} `
  }

  const formatPoolTokenPercentage = () => {
    if (!currentPair?.['shares-total'] || !currency0 || !currency1) return '0%'
    const minted = getLiquidityMinted(
      currentPair,
      currency0,
      currency1,
      currency0Amount,
      currency1Amount,
      inverse
    )
    const poolTokenPercentage = getPoolTokenPercentage(currentPair, minted)
    return poolTokenPercentage >= 0.01 ? `${poolTokenPercentage}%` : '<0.01%'
  }

  return (
    <Box>
      <CurrencyInput
        title={`Input`}
        id='liquidity-currency-input'
        currency={currency0}
        onMax={handleMaxInput}
        handleCurrencySelect={handleCurrency0Select}
        amount={currency0Amount}
        setAmount={handleCurrency0Input}
      />
      <Box className={styles.exchangeLiquidity}>
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
        title={`Input`}
        id='liquidity-currency-output'
        currency={currency1}
        handleCurrencySelect={handleCurrency1Select}
        amount={currency1Amount}
        setAmount={handleCurrency1Input}
      />
      <Box my={2}>
        {currency0 && currency1 ? (
          <Box className={styles.liquidityPrice}>
            <p>{formatPriceExchangeInfo()}</p>
          </Box>
        ) : null}
        <Box className={styles.liquidityPrice}>
          <p style={{ marginRight: 6 }}>Share of Pool:</p>
          <p style={{ color: '#fff' }}>{formatPoolTokenPercentage()}</p>
        </Box>
      </Box>
      <Box className={styles.liquidityButtonWrapper}>
        <Box style={{ width: '100%' }}>
          <Button
            fullWidth
            disabled={address && liquidityState !== AddLiquidityState.OK}
            onClick={address ? onAdd : connectWallet}
          >
            <div className={styles.liquidityButtonLabel}>
              {address
                ? getAddLiquidityButtonText(liquidityState)
                : 'Connect Wallet'}
            </div>
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default AddLiquidity
