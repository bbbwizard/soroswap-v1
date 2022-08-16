import { PropsWithChildren } from 'react'
import styles from './Navbar.module.scss'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Box, useMediaQuery } from '@material-ui/core'
import { useTheme } from '@material-ui/core/styles'
import { useStacks } from '../../providers/StacksProvider'
import { useConnect } from '@stacks/connect-react'
import { formatTokenAmount, shortenAddress } from '../../utils'
import toast from 'react-hot-toast'

interface NavbarLinkProps {
  href: string
  active?: boolean
  className?: string
}

function NavbarLink({
  href,
  children,
  className,
  active = false,
}: PropsWithChildren<NavbarLinkProps>) {
  return (
    <Link href={href}>
      <a className={`${className} ${active ? styles.active : ''}`}>
        {children}
      </a>
    </Link>
  )
}

export default function Navbar() {
  const { pathname } = useRouter()
  const { address, balances } = useStacks()
  const { doOpenAuth } = useConnect()
  const theme = useTheme()
  const tabletWindowSize = useMediaQuery(theme.breakpoints.down('sm'))
  const menuItems = [
    {
      link: '/swap',
      text: 'Swap',
      id: 'swap',
    },
    {
      link: '/pool',
      text: 'Pool',
      id: 'pool',
    },
    {
      link: '/faucet',
      text: 'Faucet',
      id: 'faucet',
    },
  ]
  const toggleWalletModal = () => {
    // console.log(address)
    if (!address) return
    const temp = document.createElement('textarea')
    temp.value = address
    document.body.appendChild(temp)
    temp.select()
    document.execCommand('copy')
    document.body.removeChild(temp)
    toast.success('Copied')
  }

  const toggleWalletConnect = () => {
    doOpenAuth()
  }

  return (
    <Box className={styles.header}>
      <NavbarLink className={styles.title} href='.'>
        <p>Soroswap</p>
      </NavbarLink>
      {!tabletWindowSize && (
        <Box className={styles.mainMenu}>
          {menuItems.map((val, index) => (
            <NavbarLink
              className={styles.menuItem}
              href={val.link}
              key={index}
              active={pathname.indexOf(val.link) > -1 ? true : false}
            >
              <p>{val.text}</p>
            </NavbarLink>
          ))}
        </Box>
      )}
      {tabletWindowSize && (
        <Box className={styles.mobileMenuContainer}>
          <Box className={styles.mobileMenu}>
            {menuItems.map((val, index) => (
              <NavbarLink
                href={val.link}
                key={index}
                active={pathname.indexOf(val.link) > -1 ? true : false}
              >
                <p>{val.text}</p>
              </NavbarLink>
            ))}
          </Box>
        </Box>
      )}
      <Box>
        {address ? (
          <Box
            id='web3-status-connected'
            className={styles.accountDetails}
            onClick={toggleWalletModal}
          >
            <Box className={styles.stxBalance}>
              <p>{formatTokenAmount(balances?.['wstx'] || 0)} STX</p>
            </Box>
            <Box className={styles.accountAddress}>
              <p>{shortenAddress(address)}</p>
            </Box>
          </Box>
        ) : (
          <Box
            className={`${styles.connectButton} ${
              address ? 'bg-error' : 'bg-primary'
            }`}
            onClick={() => {
              if (!address) {
                toggleWalletConnect()
              }
            }}
          >
            Connect Wallet
          </Box>
        )}
      </Box>
    </Box>
  )
}
