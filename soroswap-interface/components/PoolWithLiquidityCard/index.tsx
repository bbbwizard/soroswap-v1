import { useState } from 'react'
import styles from './PoolWithLiquidityCard.module.scss'
import { Box, Button } from '@material-ui/core'
import { DeleteOutlined } from '@material-ui/icons'
import { getCurrencies } from '../../lib/pairs'
import { useRouter } from 'next/router'
import RemoveLiquidity from '../RemoveLiquidity'

function PoolWithLiquidityCard(props) {
  const { index, pair } = props || {}
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const [currency0, currency1] = getCurrencies(pair)

  const onAdd = () => {
    router.push({
      pathname: '/add-liquidity/[currency0]/[currency1]',
      query: {
        currency0: currency0.contractName,
        currency1: currency1.contractName,
      },
    })
  }

  const onRemove = () => {
    setOpen(true)
  }

  return (
    <>
      <Box className={styles.pairItem} key={index}>
        <Box className={styles.pairLogoWrapper}>
          <img className={styles.pairLogo} src={currency0?.logo} />
          <img className={styles.pairLogo} src={currency1?.logo} />
        </Box>
        <p className={styles.pairName}>{pair.name}</p>
        <Box className={styles.pairButtonWrapper}>
          <Button
            className={styles.pairRemoveButton}
            onClick={onRemove}
            variant='outlined'
            color='secondary'
          >
            {/* <div className={styles.pairButtonLabel}>REMOVE</div> */}
            <DeleteOutlined className={styles.pairRemoveButtonIcon} />
          </Button>
          <Button onClick={onAdd} variant='outlined'>
            <div className={styles.pairButtonLabel}>ADD</div>
          </Button>
        </Box>
      </Box>
      <RemoveLiquidity
        open={open}
        pair={pair}
        onDismiss={() => {
          setOpen(false)
        }}
      />
    </>
  )
}

export default PoolWithLiquidityCard
