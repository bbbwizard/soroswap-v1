import React, { useCallback, useState } from 'react'
import { Box } from '@material-ui/core'
import { useStacks, useCurrencyBalance } from '../../providers/StacksProvider'
import NumericalInput from '../NumericalInput'
import CurrencySearchModal from '../CurrencySearchModal'
import { formatTokenAmount } from '../../utils'
import styles from './CurrencyInput.module.scss'

function CurrencyInput({
  id,
  title,
  currency,
  handleCurrencySelect,
  showPrice,
  onMax,
  amount,
  setAmount,
  tokenList = undefined,
}: any) {
  // const { address } = useStacks()
  const selectedCurrencyBalance = useCurrencyBalance(currency)

  const [modalOpen, setModalOpen] = useState(false)
  const handleOpenModal = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  return (
    <Box
      id={id}
      className={`${styles.swapBox} ${showPrice ? styles.priceShowBox : ''}`}
    >
      <Box className='flex justify-between'>
        <p>{title}</p>
        <p className='text-secondary'>
          {`Balance: ${formatTokenAmount(
            selectedCurrencyBalance,
            currency?.decimals
          )}`}
        </p>
      </Box>
      <Box>
        <Box className={styles.inputWrapper}>
          <NumericalInput
            value={amount}
            placeholder='0.00'
            onChange={(val: string) => {
              setAmount(val)
            }}
          />
        </Box>
        {selectedCurrencyBalance && currency && onMax ? (
          <Box className={styles.maxWrapper} marginLeft='10px' onClick={onMax}>
            <small>MAX</small>
          </Box>
        ) : null}
        <Box
          className={`${styles.currencyButton} ${
            currency ? styles.currencySelected : styles.noCurrency
          }`}
          onClick={handleOpenModal}
        >
          {currency ? (
            <>
              <img className={styles.currencyLogo} src={currency.logo} />
              <p className='token-symbol-container'>
                {currency?.displaySymbol || currency?.symbol}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 16 }}>Select a token</p>
          )}
          <svg
            className={styles.currencyArrow}
            width='12'
            height='7'
            viewBox='0 0 12 7'
            fill='none'
          >
            <path d='M0.97168 1L6.20532 6L11.439 1' stroke='#AEAEAE'></path>
          </svg>
        </Box>
      </Box>
      {modalOpen && (
        <CurrencySearchModal
          open={modalOpen}
          tokenList={tokenList}
          onDismiss={() => {
            setModalOpen(false)
          }}
          onCurrencySelect={handleCurrencySelect}
          selectedCurrency={currency}
        />
      )}
    </Box>
  )
}

export default CurrencyInput
