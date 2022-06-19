
import { $axiosInstace } from './index';

const INSIGHT_URL = "https://node-api.flipsidecrypto.com/api/v2/queries/";

export function getChurnHistory() {
  return $axiosInstace.get(INSIGHT_URL + `9fb2fd10-0a5a-4786-af5e-d5b346bcc220/data/latest`);
}