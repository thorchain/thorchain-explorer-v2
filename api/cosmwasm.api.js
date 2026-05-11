import endpoints from './endpoints'
// axios instance
import { $axiosInstace } from './index'

const cosmwasmFallbacks = {
  mainnet: 'https://thorchain-api.ibs.team/',
}

export function getContractSmartQuery(address, query) {
  const queryData = JSON.stringify(query)
  const encodedQuery =
    typeof globalThis.btoa === 'function'
      ? globalThis.btoa(queryData)
      : globalThis.Buffer.from(queryData).toString('base64')
  const queryParam = encodeURIComponent(encodedQuery)
  const path = `cosmwasm/wasm/v1/contract/${address}/smart/${queryParam}`
  const primaryUrl = endpoints[process.env.NETWORK].THORNODE_URL + path
  const fallbackUrl = cosmwasmFallbacks[process.env.NETWORK]

  return $axiosInstace.get(primaryUrl).catch((error) => {
    if (!fallbackUrl || primaryUrl.startsWith(fallbackUrl)) throw error
    return $axiosInstace.get(fallbackUrl + path)
  })
}
