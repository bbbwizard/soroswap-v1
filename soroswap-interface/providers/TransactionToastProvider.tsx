import { createContext, PropsWithChildren, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useStacks } from './StacksProvider'
interface TransactionsToastContextValue {
  addTransactionToast: (transactionId: string, pendingMessage: string) => void
}

const TransactionToastsContext = createContext<
  TransactionsToastContextValue | undefined
>(undefined)

export default function TransactionToastProvider({
  children,
}: PropsWithChildren<{}>) {
  const { currentTxStatus, currentTxId } = useStacks()

  useEffect(() => {
    if (!currentTxStatus) return
    if (currentTxStatus === 'success') {
      toast.success('Done!', { id: currentTxId })
    } else if (currentTxStatus !== 'pending') {
      toast.error('Transaction failed', { id: currentTxId })
    }
  }, [currentTxId, currentTxStatus])

  function addTransactionToast(transactionId: string, pendingMessage: string) {
    toast.loading(pendingMessage, { id: transactionId })
  }

  const value: TransactionsToastContextValue = { addTransactionToast }

  return (
    <TransactionToastsContext.Provider value={value}>
      {children}
    </TransactionToastsContext.Provider>
  )
}

export function useTransactionToasts() {
  const context = useContext(TransactionToastsContext)
  if (context === undefined) {
    throw new Error(
      'useTransactionToasts must be used within a TransactionToastProvider'
    )
  }
  return context
}
