import call from './RequestHandler';
import { Cumulonimbus } from './Cumulonimbus';

const WITH_BODY = { 'Content-Type': 'application/json' };

export class Client {
  private token: string;

  /// why spend 6 minutes implementing everything by hand when we can spend 6 hours trying to automate it
  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers: { [key: string]: string },
    bodyTemplate: string | null | ((...args: T) => string | null)
  ): (...args: T) => Promise<M> {
    return async (...args: T): Promise<M> => {
      try {
        let endpoint = (
          typeof endpointTemplate === 'string'
            ? () => endpointTemplate
            : endpointTemplate
        )(...args);
        let res = await this.authenticatedCall<M>(endpoint, {
          method,
          headers,
          body: (typeof bodyTemplate === 'function'
            ? bodyTemplate
            : () => bodyTemplate)(...args)
        });

        if (res.res.ok) return res.payload;
        else throw new Error('https://youtu.be/snKJPEVbQoE?t=20');
      } catch (error) {
        throw error;
      }
    };
  }

  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string)
  ): (this: Client, ...args: T) => Promise<M> {
    return this.manufactureMethod(endpointTemplate, 'GET', {}, null);
  }

  public static async login(
    user: string,
    pass: string,
    rememberMe: boolean = false
  ): Promise<Client> {
    try {
      let res = await call<Cumulonimbus.Data.SuccessfulAuth>('/user/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user, pass, rememberMe })
      });

      if (res.res.status === 201) {
        let rtn = new Client(res.payload.token);
        return rtn;
      } else {
        throw new Error('https://youtu.be/snKJPEVbQoE?t=20');
      }
    } catch (error) {
      throw error;
    }
  }

  public static async createAccount(
    username: string,
    password: string,
    email: string,
    rememberMe: boolean = false
  ) {
    try {
      let res = await call<Cumulonimbus.Data.SuccessfulAuth>('/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          email,
          repeatPassword: password,
          rememberMe
        })
      });

      if (res.res.ok) {
        let rtn = new Client(res.payload.token);
        return rtn;
      } else throw new Error('https://youtu.be/snKJPEVbQoE?t=20');
    } catch (error) {
      throw error;
    }
  }

  constructor(token: string) {
    this.token = token;
  }

  private async authenticatedCall<T>(
    url: string,
    options: RequestInit = { headers: {} }
  ): Promise<{ res: Response; payload: T }> {
    let opts = Object.assign(Object.create(null), options);
    if (!opts.headers) opts.headers = {};
    (opts.headers as any).Authorization = this.token;
    try {
      let authedCall = await call<T>(url, opts);
      return authedCall;
    } catch (error) {
      throw error;
    }
  }

  getSelfSessionByID = this.manufactureMethodGet<
    [string | null],
    Cumulonimbus.Data.Session
  >(sid => (sid ? `/user/session/${sid}` : '/user/session'));

  getSelfSessions = this.manufactureMethod<
    [number, number] | [],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Session>
  >(
    (limit, offset) =>
      `/user/sessions?limit=${limit || 50}&offset=${offset || 0}`,
    'GET',
    {},
    () => null
  );

  deleteSelfSessionByID = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Session
  >(session => `/user/session/${session}`, 'DELETE', {}, null);

  bulkDeleteSelfSessionsByID = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/user/sessions', 'DELETE', WITH_BODY, sessions =>
    JSON.stringify({ sessions })
  );

  bulkDeleteAllSelfSessions = this.manufactureMethod<
    [boolean | null],
    Cumulonimbus.Data.DeleteBulk
  >(
    allButSelf =>
      `/user/sessions/all?allButSelf=${JSON.stringify(allButSelf || false)}`,
    'DELETE',
    {},
    null
  );

  getSelfUser = this.manufactureMethodGet<[], Cumulonimbus.Data.User>('/user');

  editSelfUser = this.manufactureMethod<
    [string, { username?: string; newPassword?: string; email?: string }],
    Cumulonimbus.Data.User
  >('/user', 'PATCH', WITH_BODY, (password, body) => {
    let payload: { [key: string]: string } = {};
    Object.entries(body).forEach(a => {
      if (a[1]) payload[a[0]] = a[1];
    });
    return JSON.stringify({ ...payload, password });
  });

  deleteSelfUser = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.User
  >('/users', 'DELETE', WITH_BODY, (username, password) =>
    JSON.stringify({ username, password })
  );

  updateSelfDomain = this.manufactureMethod<
    [string, string | null],
    Cumulonimbus.Data.User
  >(
    () => '/user/domain',
    'PATCH',
    WITH_BODY,
    (domain, subdomain) => JSON.stringify({ domain, subdomain })
  );

  getAllDomains = this.manufactureMethodGet<
    [number, number],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Domain>
  >((limit, offset) => `/domains?limit=${limit}&offset=${offset}`);

  getDomainByID = this.manufactureMethodGet<[string], Cumulonimbus.Data.Domain>(
    id => `/domain/${id}`
  );

  getAllSelfFiles = this.manufactureMethodGet<
    [number | null, number | null],
    Cumulonimbus.Data.List<Cumulonimbus.Data.File>
  >((limit, offset) => `/user/files?limit=${limit}&offset=${offset}`);

  getSelfFileByID = this.manufactureMethodGet<[string], Cumulonimbus.Data.File>(
    id => `/user/file/${id}`
  );

  deleteSelfFileByID = this.manufactureMethod<[string], Cumulonimbus.Data.File>(
    id => `/user/file/${id}`,
    'DELETE',
    {},
    null
  );

  bulkDeleteSelfFilesByID = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/user/files', 'DELETE', WITH_BODY, files => JSON.stringify({ files }));

  bulkDeleteAllSelfFiles = this.manufactureMethod<
    [],
    Cumulonimbus.Data.DeleteBulk
  >('/user/files/all', 'DELETE', {}, null);

  getAllInstructions = this.manufactureMethodGet<
    [number | null, number | null],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Instruction>
  >(
    (limit, offset) =>
      `/instructions?limit=${limit || 50}&offset=${offset || 0}`
  );

  getInstructionByID = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Instruction
  >(id => `/instructions/${id}`);

  getUsers = this.manufactureMethodGet<
    [number | null, number | null],
    Cumulonimbus.Data.List<Cumulonimbus.Data.User>
  >((limit, offset) => `/users?limit=${limit || 50}&offset=${offset || 0}`);

  getUserByID = this.manufactureMethodGet<[string], Cumulonimbus.Data.User>(
    id => `/user/${id}`
  );

  editUserByID = this.manufactureMethod<
    [string, { username?: string; password?: string; email?: string }],
    Cumulonimbus.Data.User
  >(
    id => `/user/${id}`,
    'PATCH',
    WITH_BODY,
    (id, newContent) => {
      let payload: { [key: string]: string } = {};
      Object.entries(newContent).forEach(a => {
        if (a[1]) payload[a[0]] = a[1];
      });
      return JSON.stringify(payload);
    }
  );

  editUserDomain = this.manufactureMethod<
    [string, string, string | null],
    Cumulonimbus.Data.User
  >(
    id => `/user/${id}/domain`,
    'PATCH',
    WITH_BODY,
    (id, domain, subdomain) => JSON.stringify({ domain, subdomain })
  );

  toggleUserBan = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    id => `/users/${id}/ban`,
    'PATCH',
    {},
    null
  );

  deleteUser = this.manufactureMethod<[string], Cumulonimbus.Data.DeleteBulk>(
    id => `/user/${id}`,
    'DELETE',
    {},
    null
  );

  bulkDeleteUsers = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >(
    () => '/users',
    'DELETE',
    WITH_BODY,
    users => JSON.stringify({ users })
  );
}

export default {
  Constants: Cumulonimbus,
  Client
};
