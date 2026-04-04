/**
 * @param {import('axios').AxiosResponse} response
 * @returns {boolean}
 */
export function isApiSuccess(response) {
  return response?.data?.status === 200
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getApiErrorMessage(error) {
  const e = /** @type {{ response?: { data?: { message?: string } } }} */ (error)
  return e?.response?.data?.message || 'Something went wrong'
}
