import call from './RequestHandler';
import { Cumulonimbus as __Cumulonimbus } from './Cumulonimbus';
import toFormData from './DataToFormData';

const WITH_BODY = { 'Content-Type': 'application/json' };

export const Cumulonimbus = __Cumulonimbus;

export class Client {
  private token: string;

  private options: __Cumulonimbus.ClientOptions;

  /// why spend 6 minutes implementing everything by hand when we can spend 6 hours trying to automate it
  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers: { [key: string]: string },
    bodyTemplate:
      | string
      | null
      | ((...args: T) => string | ReturnType<typeof toFormData> | null)
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
    rememberMe: boolean = false,
    options?: __Cumulonimbus.ClientOptions
  ): Promise<Client> {
    try {
      let res = await call<__Cumulonimbus.Data.SuccessfulAuth>(
        '/user/session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user, pass, rememberMe }),
          baseURL: options && options.baseURL ? options.baseURL : undefined
        }
      );

      if (res.res.status === 201) {
        let rtn = new Client(res.payload.token, options);
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
    rememberMe: boolean = false,
    options?: __Cumulonimbus.ClientOptions
  ) {
    try {
      let res = await call<__Cumulonimbus.Data.SuccessfulAuth>('/user', {
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
        }),
        baseURL: options && options.baseURL ? options.baseURL : undefined
      });

      if (res.res.ok) {
        let rtn = new Client(res.payload.token, options);
        return rtn;
      } else throw new Error('https://youtu.be/snKJPEVbQoE?t=20');
    } catch (error) {
      throw error;
    }
  }

  public constructor(token: string, options?: __Cumulonimbus.ClientOptions) {
    this.options = options || {};
    this.token = token;
  }

  private async authenticatedCall<T>(
    url: string,
    options: RequestInit = { headers: {} }
  ): Promise<{ res: Response; payload: T }> {
    let opts = Object.assign(Object.create(null), options);
    if (!opts.headers) opts.headers = {};
    opts.baseURL = this.options.baseURL;
    (opts.headers as any).Authorization = this.token;
    try {
      let authedCall = await call<T>(url, opts);
      return authedCall;
    } catch (error) {
      throw error;
    }
  }

  public getSelfSessionByID = this.manufactureMethodGet<
    [string | null],
    __Cumulonimbus.Data.Session
  >(sid => (sid ? `/user/session/${sid}` : '/user/session'));

  public getSelfSessions = this.manufactureMethod<
    [number, number] | [],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.Session>
  >(
    (limit, offset) =>
      `/user/sessions?limit=${limit || 50}&offset=${offset || 0}`,
    'GET',
    {},
    () => null
  );

  public deleteSelfSessionByID = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.Session
  >(session => `/user/session/${session}`, 'DELETE', {}, null);

  public bulkDeleteSelfSessionsByID = this.manufactureMethod<
    [string[]],
    __Cumulonimbus.Data.DeleteBulk
  >('/user/sessions', 'DELETE', WITH_BODY, sessions =>
    JSON.stringify({ sessions })
  );

  public bulkDeleteAllSelfSessions = this.manufactureMethod<
    [boolean | null],
    __Cumulonimbus.Data.DeleteBulk
  >(
    allButSelf =>
      `/user/sessions/all?allButSelf=${JSON.stringify(allButSelf || false)}`,
    'DELETE',
    {},
    null
  );

  public getSelfUser = this.manufactureMethodGet<[], __Cumulonimbus.Data.User>(
    '/user'
  );

  public editSelfUser = this.manufactureMethod<
    [string, { username?: string; newPassword?: string; email?: string }],
    __Cumulonimbus.Data.User
  >('/user', 'PATCH', WITH_BODY, (password, body) => {
    let payload: { [key: string]: string } = {};
    Object.entries(body).forEach(a => {
      if (a[1]) payload[a[0]] = a[1];
    });
    return JSON.stringify({ ...payload, password });
  });

  public deleteSelfUser = this.manufactureMethod<
    [string, string],
    __Cumulonimbus.Data.User
  >('/user', 'DELETE', WITH_BODY, (username, password) =>
    JSON.stringify({ username, password })
  );

  public editSelfDomain = this.manufactureMethod<
    [string, string | null],
    __Cumulonimbus.Data.User
  >(
    () => '/user/domain',
    'PATCH',
    WITH_BODY,
    (domain, subdomain) => JSON.stringify({ domain, subdomain })
  );

  public getDomains = this.manufactureMethodGet<
    [number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.Domain>
  >((limit, offset) => `/domains?limit=${limit || 50}&offset=${offset || 0}`);

  public getDomainByID = this.manufactureMethodGet<
    [string],
    __Cumulonimbus.Data.Domain
  >(id => `/domain/${id}`);

  public getSelfFiles = this.manufactureMethodGet<
    [number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.File>
  >(
    (limit, offset) => `/user/files?limit=${limit || 50}&offset=${offset || 0}`
  );

  public getSelfFileByID = this.manufactureMethodGet<
    [string],
    __Cumulonimbus.Data.File
  >(id => `/user/file/${id}`);

  public deleteSelfFileByID = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.File
  >(id => `/user/file/${id}`, 'DELETE', {}, null);

  public bulkDeleteSelfFilesByID = this.manufactureMethod<
    [string[]],
    __Cumulonimbus.Data.DeleteBulk
  >('/user/files', 'DELETE', WITH_BODY, files => JSON.stringify({ files }));

  public bulkDeleteAllSelfFiles = this.manufactureMethod<
    [],
    __Cumulonimbus.Data.DeleteBulk
  >('/user/files/all', 'DELETE', {}, null);

  public getInstructions = this.manufactureMethodGet<
    [number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.Instruction>
  >(
    (limit, offset) =>
      `/instructions?limit=${limit || 50}&offset=${offset || 0}`
  );

  public getInstructionByID = this.manufactureMethodGet<
    [string],
    __Cumulonimbus.Data.Instruction
  >(id => `/instruction/${id}`);

  public getUsers = this.manufactureMethodGet<
    [number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.User>
  >((limit, offset) => `/users?limit=${limit || 50}&offset=${offset || 0}`);

  public getUserByID = this.manufactureMethodGet<
    [string],
    __Cumulonimbus.Data.User
  >(id => `/user/${id}`);

  public editUserByID = this.manufactureMethod<
    [string, { username?: string; password?: string; email?: string }],
    __Cumulonimbus.Data.User
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

  public editUserDomain = this.manufactureMethod<
    [string, string, string | null],
    __Cumulonimbus.Data.User
  >(
    id => `/user/${id}/domain`,
    'PATCH',
    WITH_BODY,
    (id, domain, subdomain) => JSON.stringify({ domain, subdomain })
  );

  public toggleUserBan = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.User
  >(id => `/user/${id}/ban`, 'PATCH', {}, null);

  public deleteUserByID = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.User
  >(id => `/user/${id}`, 'DELETE', {}, null);

  public bulkDeleteUsersByID = this.manufactureMethod<
    [string[]],
    __Cumulonimbus.Data.DeleteBulk
  >(
    () => '/users',
    'DELETE',
    WITH_BODY,
    users => JSON.stringify({ users })
  );

  public createDomain = this.manufactureMethod<
    [string, boolean],
    __Cumulonimbus.Data.Domain
  >('/domain', 'POST', WITH_BODY, (domain, allowsSubdomains) =>
    JSON.stringify({ domain, allowsSubdomains })
  );

  public editDomainByID = this.manufactureMethod<
    [string, boolean],
    __Cumulonimbus.Data.Domain
  >(
    id => `/domain/${id}`,
    'PATCH',
    WITH_BODY,
    (id, allowsSubdomains) => JSON.stringify({ allowsSubdomains })
  );

  public deleteDomainByID = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.Domain
  >(id => `/domain/${id}`, 'DELETE', {}, null);

  public bulkDeleteDomainsByID = this.manufactureMethod<
    [string[]],
    __Cumulonimbus.Data.DeleteBulk
  >('/domains', 'DELETE', WITH_BODY, domains => JSON.stringify({ domains }));

  public getFiles = this.manufactureMethodGet<
    [number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.File>
  >((limit, offset) => `/files?limit=${limit || 50}&offset=${offset || 0}`);

  public getUserFiles = this.manufactureMethodGet<
    [string, number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.File>
  >(
    (userID, limit, offset) =>
      `/user/${userID}/files?limit=${limit || 50}&offset=${offset || 0}`
  );

  public getFileByID = this.manufactureMethodGet<
    [string],
    __Cumulonimbus.Data.File
  >(fileID => `/file/${fileID}`);

  public deleteFileByID = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.File
  >(fileID => `/file/${fileID}`, 'DELETE', {}, null);

  public bulkDeleteFilesByID = this.manufactureMethod<
    [string[]],
    __Cumulonimbus.Data.DeleteBulk
  >('/files', 'DELETE', WITH_BODY, files => JSON.stringify({ files }));

  public createInstruction = this.manufactureMethod<
    [string, string[], string, string, string, string],
    __Cumulonimbus.Data.Instruction
  >(
    '/instruction',
    'POST',
    WITH_BODY,
    (name, steps, filename, fileContent, description, displayName) =>
      JSON.stringify({
        name,
        steps,
        filename,
        fileContent,
        description,
        displayName
      })
  );

  public editInstructionByID = this.manufactureMethod<
    [
      string,
      {
        steps?: string[];
        filename?: string;
        fileContent?: string;
        description?: string;
        displayName?: string;
      }
    ],
    __Cumulonimbus.Data.Instruction
  >(
    id => `/instruction/${id}`,
    'PATCH',
    WITH_BODY,
    (id, newContent) => {
      let payload: { [key: string]: string | string[] } = {};
      Object.entries(newContent).forEach(a => {
        if (a[1]) payload[a[0]] = a[1];
      });
      return JSON.stringify(payload);
    }
  );

  public deleteInstructionByID = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.Instruction
  >(id => `/instruction/${id}`, 'DELETE', {}, null);

  public bulkDeleteInstructionsByID = this.manufactureMethod<
    [string[]],
    __Cumulonimbus.Data.DeleteBulk
  >('/instructions', 'DELETE', WITH_BODY, instructions =>
    JSON.stringify({ instructions })
  );

  public getUserSessionsByID = this.manufactureMethodGet<
    [string, number | null, number | null],
    __Cumulonimbus.Data.List<__Cumulonimbus.Data.Session>
  >(
    (id, limit, offset) =>
      `/user/${id}/sessions?limit=${limit || 50}&offset=${offset || 0}`
  );

  public getUserSessionByID = this.manufactureMethodGet<
    [string, string],
    __Cumulonimbus.Data.Session
  >((id, sid) => `/user/${id}/session/${sid}`);

  public deleteUserSessionByID = this.manufactureMethod<
    [string, string],
    __Cumulonimbus.Data.Session
  >((id, sid) => `/user/${id}/session/${sid}`, 'DELETE', {}, null);

  public bulkDeleteUserSessionsByID = this.manufactureMethod<
    [string, string[]],
    __Cumulonimbus.Data.DeleteBulk
  >(
    id => `/user/${id}/sessions`,
    'DELETE',
    WITH_BODY,
    (id, sessions) => JSON.stringify({ sessions })
  );

  public bulkDeleteUserSessions = this.manufactureMethod<
    [string],
    __Cumulonimbus.Data.DeleteBulk
  >(id => `/user/${id}/sessions/all`, 'DELETE', {}, null);

  public uploadData = this.manufactureMethod<
    [Buffer | ArrayBuffer | Blob | File, string | undefined],
    __Cumulonimbus.Data.SuccessfulUpload
  >('/upload', 'POST', {}, (file, filename) => toFormData(file, filename));
}

export default {
  Cumulonimbus: __Cumulonimbus,
  Client
};
