import { $axiosInstace } from './index';

export function getDashboardData() {
  return $axiosInstace.get(process.env.SERVER_URL + `api/dashboardData`);
}

export function getDashboardPlots() {
  return $axiosInstace.get(process.env.SERVER_URL + `api/dashboardPlots`);
}