import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Box, Button, Slider, Modal, Backdrop, Fade } from '@material-ui/core'
import NumericalInput from '../NumericalInput'
import { useStacks } from '../../providers/StacksProvider'
import { useConnect } from '@stacks/connect-react'
import { getCurrencies } from '../../lib/pairs'
import { buildRemoveLiquidityRequest } from '../../lib/liquidity'
import { formatTokenAmount } from '../../utils'
import { useTransactionToasts } from '../../providers/TransactionToastProvider'
import styles from './RemoveLiquidity.module.scss'

function RemoveLiquidity(props: any) {
  const { open, onDismiss, pair: currentPair } = props || {}
  const { address, balances, addPendingTransaction, currentTxStatus } =
    useStacks()
  const { doContractCall } = useConnect()
  const { addTransactionToast } = useTransactionToasts()
  const [percentage, setPercentage] = useState<number | undefined>(undefined)
  const [removeAmount, setRemoveAmount] = useState<number | undefined>(
    undefined
  )
  const [currentTx, setCurrentTx] = useState<string | undefined>(undefined)

  const [currency0, currency1] = getCurrencies(currentPair)
  const lpBalance = balances?.[`${currentPair?.liquidityToken}`] || 0

  useEffect(() => {
    if (!currentTxStatus || !currentTx) return
    if (currentTxStatus === 'success') {
      onDismiss()
    }
  }, [currentTx, currentTxStatus])

  const onRemove = async () => {
    const req = buildRemoveLiquidityRequest(
      address,
      currency0,
      currency1,
      currentPair,
      percentage,
      lpBalance,
      false,
      (data) => {
        console.log(data)
        const { txId } = data || {}
        addPendingTransaction(txId)
        setCurrentTx(txId)
        addTransactionToast(
          txId,
          `Removing liquidity, please wait a few moment...`
        )
      }
    )
    await doContractCall(req)
  }

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box
          className={styles.removeLiquidityWrapper}
          paddingX={3}
          paddingY={4}
        >
          <Box className='flex items-center justify-between'>
            <p style={{ fontSize: 20, marginTop: 0, color: '#fff' }}>
              Remove Liquidity
            </p>
          </Box>
          <Box className={styles.removeLiquidityContent}>
            <Box>
              <Box className='flex items-center'>
                <Box className={styles.pairLogoWrapper}>
                  <img className={styles.pairLogo} src={currency0?.logo} />
                  <img className={styles.pairLogo} src={currency1?.logo} />
                </Box>
                <p>
                  {currency0?.symbol} / {currency1?.symbol} LP
                </p>
              </Box>
              <Box>
                <p>
                  Balance: {formatTokenAmount(lpBalance, currentPair?.decimals)}
                </p>
              </Box>
            </Box>
            <Box mt={2}>
              <NumericalInput
                placeholder='0'
                value={removeAmount}
                fontSize={28}
                onUserInput={(value) => {
                  if (lpBalance) {
                    setPercentage(Math.round((+value * 100) / lpBalance))
                  }
                  setRemoveAmount(+value)
                }}
              />
            </Box>
            <Box
              className={`${styles.liquiditySliderWrapper} item-center flex`}
            >
              <Box className={styles.liquiditySlider}>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={percentage}
                  onChange={(event, value) => {
                    if (!Array.isArray(value)) {
                      setPercentage(+value)
                      if (lpBalance) {
                        setRemoveAmount(Math.round((+value / 100) * lpBalance))
                      }
                    }
                  }}
                />
              </Box>
              <Box style={{ minWidth: 35 }}>
                <p>{percentage}%</p>
              </Box>
            </Box>
          </Box>
          <Box className={styles.removeLiquidityButtonWrapper}>
            <Box style={{ width: '100%' }}>
              <Button fullWidth disabled={!percentage} onClick={onRemove}>
                <div className={styles.removeLiquidityButtonLabel}>Remove</div>
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  )
}

export default RemoveLiquidity
