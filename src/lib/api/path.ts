// Endpoint paths are declared as contract patterns (`/api/v1/profiles/:identifier`) and filled with
// named params. Values are percent-encoded, so user input (`../`, `?`, `#`) can never change the
// route. The pattern, not the concrete URL, identifies the endpoint in errors and reports.

export type EndpointPattern = `/api/v1/${string}`

type ParamNames<P extends string> = P extends `${string}:${infer Name}/${infer Rest}`
  ? Name | ParamNames<`/${Rest}`>
  : P extends `${string}:${infer Name}`
    ? Name
    : never

/** `params` is required, with exactly the pattern's names, only when the pattern has params. */
export type PathParams<P extends string> = [ParamNames<P>] extends [never]
  ? { params?: undefined }
  : { params: Record<ParamNames<P>, string> }

export class InvalidPathParamError extends Error {
  constructor(pattern: string, name: string) {
    super(`Missing or empty path param "${name}" for ${pattern}`)
    this.name = 'InvalidPathParamError'
  }
}

/** Fills a pattern with encoded params. A missing or empty param is a programming error: throws. */
export function buildPath(pattern: string, params: Record<string, string> = {}): string {
  return pattern.replace(/:([A-Za-z]\w*)/g, (_match, name: string) => {
    const value = params[name]
    if (value === undefined || value === '') throw new InvalidPathParamError(pattern, name)
    return encodeURIComponent(value)
  })
}
