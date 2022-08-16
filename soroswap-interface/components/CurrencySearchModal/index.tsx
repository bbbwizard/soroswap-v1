import React, {
  useCallback,
  KeyboardEvent,
  useState,
  useRef,
  RefObject,
} from 'react'
import { Modal, Box, Backdrop, Fade, ListItem } from '@material-ui/core'
import { tokens } from '../../lib/constants'
import { formatTokenAmount } from '../../utils'
import { useStacks } from '../../providers/StacksProvider'
import styles from './CurrencySearchModal.module.scss'

interface CurrencySearchModalProps {
  open: boolean
  onDismiss: () => void
  onCurrencySelect: (currency: any) => void
  selectedCurrency: any
  tokenList?: any
}

function CurrencySearchModal({
  open,
  selectedCurrency,
  onDismiss,
  onCurrencySelect,
  tokenList,
}: CurrencySearchModalProps) {
  const handleCurrencySelect = useCallback(
    (currency: any) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )
  const { balances } = useStacks()
  const inputRef = useRef<HTMLInputElement>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const _tokens = tokenList || Array.from(tokens)
  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (_tokens.length > 0) {
          if (
            _tokens[0].symbol?.toLowerCase() ===
              searchQuery.trim().toLowerCase() ||
            _tokens.length === 1
          ) {
            handleCurrencySelect(_tokens[0])
          }
        }
      }
    },
    [handleCurrencySelect, searchQuery]
  )

  return (
    <Modal
      open={open}
      onClose={onDismiss}
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box className={styles.currencySearchWrapper}>
          <Box className={styles.currencySearchHeader}>
            <h6>Select a token</h6>
            {/* <CloseIcon onClick={onDismiss} /> */}
          </Box>
          <Box className={styles.searchInputWrapper}>
            {/* <SearchIcon /> */}
            <input
              type='text'
              placeholder='Search name'
              value={searchQuery}
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleEnter}
            />
          </Box>
          <Box flex={1} className={styles.currencyTokenList}>
            {_tokens.map((token, index) => {
              const isSelected = selectedCurrency == token.symbol
              const balance = balances?.[token.contractName] || undefined
              return (
                <ListItem
                  button
                  className={styles.currencyListItem}
                  key={index}
                  selected={isSelected}
                  onClick={() => {
                    if (!isSelected) handleCurrencySelect(token)
                  }}
                >
                  <Box className={styles.currencyRow}>
                    {/* {isSelected && <TokenSelectedIcon />} */}
                    <img className={styles.currencyLogo} src={token.logo} />
                    <p className={styles.currencySymbol}>
                      {token.displaySymbol || token.symbol}
                    </p>
                    {balance ? (
                      <Box className={styles.currencyBalance}>
                        {formatTokenAmount(balance, token.decimals)}
                      </Box>
                    ) : null}
                  </Box>
                </ListItem>
              )
            })}
          </Box>
          <Box className={styles.currencySearchFooter} />
        </Box>
      </Fade>
    </Modal>
  )
}

export default CurrencySearchModal
