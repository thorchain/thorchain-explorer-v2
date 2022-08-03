import endpoints from './endpoints';
import { $axiosInstace } from './index';

export function getDashboardData() {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + `api/dashboardData`);
}

export function getDashboardPlots() {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + `api/dashboardPlots`);
}

export function getExraNodesInfo() {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + `api/extraNodesInfo`);
}

export function getOhclPrice() {
  return $axiosInstace.get(endpoints[process.env.NETWORK].SERVER_URL + `api/ohclPrice`);
}