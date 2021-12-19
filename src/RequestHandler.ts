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
  options: RequestInit = { headers: {} }
) {
  let opts = Object.assign(Object.create(null), options);
  if (!opts.headers) opts.headers = {};
  (opts.headers as any)[
    'User-Agent'
  ] = `Cumulonimbus-Wrapper: ${Cumulonimbus.VERSION}`;
  let res: Response = await fetchFun(Cumulonimbus.BASE_URL + url, opts);

  let json: T = await res.json();
  if (res.ok) {
    return { res, payload: json };
  } else {
    throw new Cumulonimbus.ResponseError(
      json as unknown as Cumulonimbus.Data.Error
    );
  }
}
