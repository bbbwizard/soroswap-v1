import { Connect } from '@stacks/connect-react'
import { AuthOptions } from '@stacks/connect'
import { AppConfig, UserData, UserSession } from '@stacks/connect'
import { StacksNetwork } from '@stacks/network'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react'
import { resolveAddress, network } from '../utils'
import { appDetails } from '../lib/constants'
import { getBalance } from '../lib/fetchBalance'
import { getTransaction } from '../lib/fetchTransaction'
interface TokenBalance {
  wstx: number | undefined
  wbtc: number | undefined
  wusdc: number | undefined
  'wusdc-wstx-token': number | undefined
  'wbtc-wstx-token': number | undefined
  'wbtc-wusdc-token': number | undefined
}

interface StacksContextValue {
  network: StacksNetwork
  address?: string
  slippageTolerance: number
  setSlippageTolerance: (slippage: number) => void
  balances?: TokenBalance
  pendingTransactions?: Set<string>
  currentTxStatus: string | undefined
  addPendingTransaction: any
  currentTxId: string | undefined
  requestBalance: any
}

const AuthContext = createContext<StacksContextValue | undefined>(undefined)

export default function StacksProvider({ children }: PropsWithChildren<{}>) {
  const [userData, setUserData] = useState<UserData | undefined>(undefined)
  const [balances, setBalances] = useState<TokenBalance | undefined>(undefined)
  const [slippageTolerance, setSlippageTolerance] = useState(3.0)
  const [pendingTransactions, setPendingTransactions] = useState<Set<string>>(
    new Set()
  )
  const [currentTxStatus, setCurrentTxStatus] = useState<string | undefined>(
    undefined
  )
  const [currentTxId, setCurrentTxId] = useState<string | undefined>()
  const appConfig = new AppConfig(['store_write', 'publish_data'])
  const userSession = new UserSession({ appConfig })

  const address: string | undefined = resolveAddress(userData)

  const requestBalance = async () => {
    console.log(`request balances: ${address}`)
    if (!address) return
    const res = await getBalance(address)
    setBalances(res)
  }

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData)
        requestBalance()
      })
    } else {
      console.warn(address, 'fetch balance')
      requestBalance()
    }
    console.warn(userSession)
  }, [address])

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData())
      requestBalance()
    }
    console.warn(userSession)
  }, [address])

  const authOptions: AuthOptions = {
    redirectTo: '/',
    userSession,
    onFinish: ({ userSession }) => {
      console.log(userSession)
      setUserData(userSession.loadUserData())
      requestBalance()
      // window.location.reload()
    },
    appDetails,
  }

  function addPendingTransaction(transactionId: string) {
    console.log(`listening to updates for transaction ${transactionId}`)
    setCurrentTxId(transactionId)
    setPendingTransactions((transactionIds) => {
      const newTransactionIds = new Set(transactionIds)
      newTransactionIds.add(transactionId)
      return newTransactionIds
    })
  }

  const value: StacksContextValue = {
    network,
    address,
    balances,
    slippageTolerance,
    setSlippageTolerance,
    pendingTransactions,
    addPendingTransaction,
    currentTxStatus,
    currentTxId,
    requestBalance,
  }

  useEffect(() => {
    const interval = setInterval(() => {
      updateAllTransactions(pendingTransactions)
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [pendingTransactions])

  async function updateAllTransactions(transactionIds: Set<string>) {
    transactionIds.forEach(async (transactionId) => {
      console.log('Checking latest status of transaction:', transactionId)
      await getTransactionStatus(transactionId)
    })
  }

  async function getTransactionStatus(transactionId: string) {
    const json = await getTransaction(transactionId)
    console.log(json)
    const status = json['tx_status']
    setCurrentTxStatus(status)
    if (status !== 'pending') {
      setPendingTransactions((transactionIds) => {
        const newTransactionIds = new Set(transactionIds)
        newTransactionIds.delete(transactionId)
        return newTransactionIds
      })
      requestBalance()
    }
  }

  return (
    <Connect authOptions={authOptions}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </Connect>
  )
}

export function useStacks() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider')
  }
  return context
}

export function useCurrencyBalance(currency: any) {
  const { address, balances } = useStacks()
  if (!address || !balances || !currency) return undefined
  return balances[currency.symbol?.toLowerCase()] || 0
}
