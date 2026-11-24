import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // free hosting can take ~50s to wake a sleeping server
});

/** Turns any axios failure into { message, code, status } with wording a reader can act on. */
export function toApiError(err) {
  const apiError = err?.response?.data?.error;
  if (apiError) {
    return { message: apiError.message, code: apiError.code, status: err.response.status };
  }
  if (err?.code === 'ECONNABORTED') {
    return { message: 'The request took too long. Check your connection and try again.', code: 'TIMEOUT', status: 0 };
  }
  return {
    message: "Can't reach the Sportsphere server. Make sure the backend is running, then try again.",
    code: 'NETWORK',
    status: 0,
  };
}

export const isCancelled = (err) => axios.isCancel(err);
