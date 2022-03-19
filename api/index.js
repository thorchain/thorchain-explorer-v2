import { getStats, getTxs, getConstants, getTx, getAddress, getPoolStats, getPoolTxs } from './midgard.api';
import { getMimir, getBalance } from './thornode.api';
export var $axiosInstace;

// interceptor to catch errors
const errorInterceptor = error => {
  // check if it's a server error
  if (!error.response) {
    console.warn('Network/Server error');
    return Promise.reject(error);
  }

  // all the other error responses
  switch(error.response.status) {
      case 400:
          console.error(error.response.status, error.message);
          console.warn('Nothing to display','Data Not Found');
          break;

      case 401: // authentication error, logout the user
          console.warn( 'Please login again', 'Session Expired');
          break;

      case 429: // too many requests
          console.warn( 'Too many requests, Try again');
          break;

      case 501: // Wrong request
          console.warn( 'Wrong Request');
          break;

      case 503: // Wrong request
          console.warn( 'Service Unavailable');
          break;

      default:
          console.error(error.response.status, error.message);
          console.error('Server Error');

  }
  return Promise.reject(error);
}

// Interceptor for responses
const responseInterceptor = response => {
  switch(response.status) {
      case 200: 
          // yay!
          break;
      // any other cases
      default:
          // default case
  }

  return response;
}

export default function ({ $axios }, inject) {
  $axios.interceptors.response.use(responseInterceptor, errorInterceptor);

  //defining the inner Vue axios instace to the outer scope
  $axiosInstace = $axios;

  let api = {
    getStats,
    getTxs,
    getConstants,
    getMimir,
    getTx,
    getAddress,
    getPoolStats,
    getPoolTxs,
    getBalance
  }

  inject('api', api);
}