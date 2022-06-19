
import { $axiosInstace } from './index';

const INSIGHT_URL = "https://node-api.flipsidecrypto.com/api/v2/queries/";

export function getChurnHistory() {
  return $axiosInstace.get(INSIGHT_URL + `9fb2fd10-0a5a-4786-af5e-d5b346bcc220/data/latest`);
}

export function getFlipTVL() {
  return $axiosInstace.get(INSIGHT_URL + `ed73580a-3555-4750-b1fa-03d3c6bf59e3/data/latest`);
}