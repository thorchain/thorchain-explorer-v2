import endpoints from './endpoints'
// axios instance
import { $axiosInstace } from './index'

export function getTHORLastBlock() {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + 'lastblock'
  )
}

export function getBlockHeight(height) {
  return $axiosInstace.get(
    endpoints[process.env.NETWORK].SERVER_URL + `block?height=${height}`
  );
}
