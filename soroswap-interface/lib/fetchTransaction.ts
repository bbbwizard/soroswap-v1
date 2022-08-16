import { network } from '../utils'

async function getTransaction(transactionId: string) {
  const apiUrl = network.coreApiUrl
  const url = `${apiUrl}/extended/v1/tx/${transactionId}`
  const res = await fetch(url)
  const json = await res.json()
  return json
}

export { getTransaction }
