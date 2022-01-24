import { Cumulonimbus } from './Cumulonimbus';

let fetchFun: Function;

(async function () {
  try {
    fetchFun = window.fetch;
  } catch (error) {
    let a = await import('node-fetch');
    fetchFun = a.default;
  }
})();

export default async function call<T>(
  url: string,
  options: Cumulonimbus.APICallRequestInit = { headers: {} }
) {
  try {
    let opts = Object.assign(Object.create(null), options);
    if (!opts.headers) opts.headers = {};
    (opts.headers as any)[
      'User-Agent'
    ] = `Cumulonimbus-Wrapper: ${Cumulonimbus.VERSION}`;
    let res: Response = await fetchFun(
      options.baseURL || Cumulonimbus.BASE_URL + url,
      opts
    );

    if (res.status === 413) {
      throw new Cumulonimbus.ResponseError({
        code: 'BODY_TOO_LARGE_ERROR',
        message: 'Request Body Too Large',
        ratelimit: {
          maxRequests: Number(res.headers.get('X-RateLimit-Limit')),
          remainingRequests: Number(res.headers.get('X-RateLimit-Remaining')),
          resetsAt: Number(res.headers.get('X-RateLimit-Reset'))
        }
      });
    }

    try {
      let json: T = await res.json();
      if (res.ok) {
        return {
          res,
          payload: {
            ...json,
            ratelimit: {
              maxRequests: Number(res.headers.get('X-RateLimit-Limit')),
              remainingRequests: Number(
                res.headers.get('X-RateLimit-Remaining')
              ),
              resetsAt: Number(res.headers.get('X-RateLimit-Reset'))
            }
          }
        };
      } else {
        throw new Cumulonimbus.ResponseError({
          ...(json as unknown as Cumulonimbus.Data.Error),
          ratelimit: {
            maxRequests: Number(res.headers.get('X-RateLimit-Limit')),
            remainingRequests: Number(res.headers.get('X-RateLimit-Remaining')),
            resetsAt: Number(res.headers.get('X-RateLimit-Reset'))
          }
        });
      }
    } catch (error) {
      if (error instanceof Cumulonimbus.ResponseError) throw error;
      else
        throw new Cumulonimbus.ResponseError({
          code: 'GENERIC_ERROR',
          message: null,
          ratelimit: {
            maxRequests: Number(res.headers.get('X-RateLimit-Limit')),
            remainingRequests: Number(res.headers.get('X-RateLimit-Remaining')),
            resetsAt: Number(res.headers.get('X-RateLimit-Reset'))
          }
        });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
