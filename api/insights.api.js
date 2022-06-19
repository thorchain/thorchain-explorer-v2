
import { $axiosInstace } from './index';

const INSIGHT_URL = "https://node-api.flipsidecrypto.com/api/v2/queries/";

export function getChurnHistory() {
  return $axiosInstace.get(INSIGHT_URL + `a82e302f-c9a1-451b-8f49-3cf6b7c39d91/data/latest`);
}