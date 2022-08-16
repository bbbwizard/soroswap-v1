import styles from './PoolCard.module.scss'
import { Box, Button } from '@material-ui/core'
import { getCurrencies } from '../../lib/pairs'
import { useRouter } from 'next/router'

function PoolCard(props) {
  const { index, pair } = props || {}
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

  return (
    <Box className={styles.pairItem} key={index}>
      <Box className={styles.pairLogoWrapper}>
        <img className={styles.pairLogo} src={currency0?.logo} />
        <img className={styles.pairLogo} src={currency1?.logo} />
      </Box>
      <p className={styles.pairName}>{pair.name}</p>
      <Box className={styles.pairButtonWrapper}>
        <Button onClick={onAdd} variant='outlined'>
          <div className={styles.pairButtonLabel}>ADD</div>
        </Button>
      </Box>
    </Box>
  )
}

export default PoolCard
