import fetch from 'isomorphic-fetch';
import toFormData from './isomorphicFormData';

// Get version from package.json
const version = require('../package.json').version;

// deep merge two objects without overwriting existing properties
function merge(obj1: any, obj2: any) {
  const result = { ...obj1 };
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (typeof obj2[key] === 'object') {
        result[key] = merge(result[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }
  return result;
}

const WITH_BODY = {
  'Content-Type': 'application/json'
};

class Cumulonimbus {
  private token: string;
  private options: Cumulonimbus.ClientOptions;

  constructor(token: string, options?: Cumulonimbus.ClientOptions) {
    this.token = token;
    this.options = options || {};
  }

  private async call<T>(
    url: string,
    options: Cumulonimbus.APICallRequestInit = {}
  ): Promise<Cumulonimbus.APIResponse<T>> {
    const opts = merge(options, {
      headers: {
        'User-Agent': `Cumulonimbus/${version}`
      }
    });

    const res = await fetch(
      (options.baseURL || this.options.baseURL || Cumulonimbus.BASE_URL) + url,
      opts
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get('X-Ratelimit-Limit')) {
      ratelimit = {
        max: Number(res.headers.get('X-RateLimit-Limit')),
        remaining: Number(res.headers.get('X-RateLimit-Remaining')),
        reset: Number(res.headers.get('X-RateLimit-Reset'))
      };
    }

    // Check if the response is a 413, and if so, construct a new BODY_TOO_LARGE error, as we can't be sure the server returns a proper error
    if (res.status === 413) {
      throw new Cumulonimbus.ResponseError(
        {
          code: 'BODY_TOO_LARGE_ERROR',
          message: 'Body Too Large'
        },
        ratelimit
      );
    }

    try {
      let json = await res.json();
      if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);
      else return { result: json, ratelimit, response: res };
    } catch (error) {
      if (error instanceof Cumulonimbus.ResponseError) throw error;
      else
        throw new Cumulonimbus.ResponseError(
          {
            code: 'GENERIC_ERROR',
            message: null
          },
          ratelimit
        );
    }
  }

  private async authenticatedCall<T>(
    url: string,
    options: Cumulonimbus.APICallRequestInit = {}
  ) {
    const opts = merge(options, {
      headers: {
        Authorization: this.token
      }
    });
    return this.call<T>(url, opts);
  }

  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers: { [key: string]: string } = {},
    bodyTemplate: string | null | ((...args: T) => string) = null
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>> {
    return async (...args: T): Promise<Cumulonimbus.APIResponse<M>> => {
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

        if (res.response.ok) return res;
        else throw new Error('https://youtu.be/snKJPEVbQoE?t=20');
      } catch (error) {
        throw error;
      }
    };
  }

  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    headers: { [key: string]: string } = {}
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>> {
    return this.manufactureMethod<T, M>(endpointTemplate, 'GET', headers, null);
  }

  private toQueryString(params: {
    [key: string]: string | number | boolean;
  }): string {
    if (
      Object.entries(params).filter(
        ([key, value]) => value !== null && value !== '' && value !== undefined
      ).length === 0
    )
      return '';
    else
      return (
        '?' +
        Object.entries(params)
          .filter(
            ([key, value]) =>
              value !== null && value !== '' && value !== undefined
          )
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
          )
          .join('&')
      );
  }

  public static async login(
    user: string,
    pass: string,
    rememberMe: boolean = false,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent': `Cumulonimbus-Wrapper/${version}`
    };
    if (tokenName) headers['X-Token-Name'] = tokenName;
    const res = await fetch(
      (options && options.baseURL ? options.baseURL : Cumulonimbus.BASE_URL) +
        '/user/session',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user,
          pass,
          rememberMe
        })
      }
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get('X-Ratelimit-Limit')) {
      ratelimit = {
        max: Number(res.headers.get('X-RateLimit-Limit')),
        remaining: Number(res.headers.get('X-RateLimit-Remaining')),
        reset: Number(res.headers.get('X-RateLimit-Reset'))
      };
    }

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, options);
  }

  public static async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    rememberMe: boolean = false,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent': `Cumulonimbus-Wrapper/${version}`
    };
    if (tokenName) headers['X-Token-Name'] = tokenName;
    const res = await fetch(
      (options && options.baseURL ? options.baseURL : Cumulonimbus.BASE_URL) +
        '/user',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
          rememberMe,
          repeatPassword: confirmPassword
        })
      }
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get('X-Ratelimit-Limit')) {
      ratelimit = {
        max: Number(res.headers.get('X-RateLimit-Limit')),
        remaining: Number(res.headers.get('X-RateLimit-Remaining')),
        reset: Number(res.headers.get('X-RateLimit-Reset'))
      };
    }

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, options);
  }

  // API Sanity Checks

  public static async apiSanity(
    baseURL?: string
  ): Promise<Cumulonimbus.Data.SanityCheck> {
    const res = await fetch(baseURL || Cumulonimbus.BASE_URL);
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'GENERIC_ERROR',
        message: undefined
      });
    else {
      const json = await res.json();
      return {
        ...json
      };
    }
  }

  public static async thumbnailSanity(
    baseThumbURL?: string
  ): Promise<Cumulonimbus.Data.SanityCheck> {
    const res = await fetch(baseThumbURL || Cumulonimbus.BASE_THUMB_URL);
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'GENERIC_ERROR',
        message: undefined
      });
    else {
      const json = await res.json();
      return {
        ...json
      };
    }
  }

  // Get Thumbnail

  public async getThumbnail(
    file: string | Cumulonimbus.Data.File
  ): Promise<ArrayBuffer> {
    const fileName = typeof file === 'string' ? file : file.filename;
    const res = await fetch(`${this.options.baseThumbnailURL}/${fileName}`);
    if (!res.ok) {
      throw new Cumulonimbus.ThumbnailError(res);
    } else {
      return await res.arrayBuffer();
    }
  }

  // API Endpoints

  // Non-administrative methods

  // Session methods

  public getSelfSession = this.manufactureMethodGet<
    [string | undefined],
    Cumulonimbus.Data.Session
  >(sid => `/user/session${sid ? `/${sid}` : ''}`);

  public getSelfSessions = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Session>
  >(
    (limit, offset) => `/user/sessions${this.toQueryString({ limit, offset })}`
  );

  public deleteSelfSession = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Session
  >(sid => `/user/session/${sid}`, 'DELETE', WITH_BODY);

  public deleteSelfSessions = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/user/sessions', 'DELETE', WITH_BODY, sids =>
    JSON.stringify({ sessions: sids })
  );

  public deleteAllSelfSessions = this.manufactureMethod<
    [boolean | undefined],
    Cumulonimbus.Data.DeleteBulk
  >(
    allButSelf => `/user/sessions/all${this.toQueryString({ allButSelf })}`,
    'DELETE'
  );

  // User methods

  public getSelf = this.manufactureMethodGet<[], Cumulonimbus.Data.User>(
    '/user'
  );

  public editSelf = this.manufactureMethod<
    [string, { username?: string; email?: string; newPassword?: string }],
    Cumulonimbus.Data.User
  >('/user', 'PATCH', WITH_BODY, (password, data) =>
    JSON.stringify({ password, ...data })
  );

  public editSelfDomain = this.manufactureMethod<
    [string, string | undefined],
    Cumulonimbus.Data.User
  >('/user/domain', 'PATCH', WITH_BODY, (domain, subdomain) => {
    if (subdomain) return JSON.stringify({ domain, subdomain });
    else return JSON.stringify({ domain });
  });

  public deleteSelf = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.User
  >('/user', 'DELETE', WITH_BODY, (username, password) =>
    JSON.stringify({ username, password })
  );

  // Domain methods

  public getDomains = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Domain>
  >((limit, offset) => `/domains${this.toQueryString({ limit, offset })}`);

  public getSlimDomains = this.manufactureMethodGet<
    [],
    Cumulonimbus.Data.List<Cumulonimbus.Data.DomainSlim>
  >('/domains/slim');

  public getDomain = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Domain
  >(domain => `/domain/${domain}`);

  // File methods

  public getSelfFiles = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.File>
  >((limit, offset) => `/user/files${this.toQueryString({ limit, offset })}`);

  public getSelfFile = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.File
  >(file => `/user/file/${file}`);

  public deleteSelfFile = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.File
  >(file => `/user/file/${file}`, 'DELETE');

  public deleteSelfFiles = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/user/files', 'DELETE', WITH_BODY, files => JSON.stringify({ files }));

  public deleteAllSelfFiles = this.manufactureMethod<
    [],
    Cumulonimbus.Data.DeleteBulk
  >('/user/files/all', 'DELETE');

  // Instruction methods

  public getInstructions = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Instruction>
  >((limit, offset) => `/instructions${this.toQueryString({ limit, offset })}`);

  public getInstruction = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Instruction
  >(instruction => `/instruction/${instruction}`);

  public async upload(
    file: string | Buffer | File | Blob | ArrayBuffer
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SuccessfulUpload>> {
    const formData = await toFormData(file);
    const res =
      await this.authenticatedCall<Cumulonimbus.Data.SuccessfulUpload>(
        '/upload',
        {
          method: 'POST',
          body: formData
        }
      );
    return res;
  }

  // Administrative methods

  // User methods

  public getUsers = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.User>
  >((limit, offset) => `/users${this.toQueryString({ limit, offset })}`);

  public getUser = this.manufactureMethodGet<[string], Cumulonimbus.Data.User>(
    id => `/user/${id}`
  );

  public editUser = this.manufactureMethod<
    [
      string,
      { username?: string; email?: string; password?: string; staff?: boolean }
    ],
    Cumulonimbus.Data.User
  >(
    (id, data) => `/user/${id}`,
    'PATCH',
    WITH_BODY,
    (id, data) => JSON.stringify({ ...data })
  );

  public editUserDomain = this.manufactureMethod<
    [string, string, string | undefined],
    Cumulonimbus.Data.User
  >(
    (id, domain, subdomain) => `/user/${id}/domain`,
    'PATCH',
    WITH_BODY,
    (id, domain, subdomain) => {
      if (subdomain) return JSON.stringify({ domain, subdomain });
      else return JSON.stringify({ domain });
    }
  );

  public toggleUserBan = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.User
  >(id => `/user/${id}/ban`, 'PATCH');

  public deleteUser = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    id => `/user/${id}`,
    'DELETE'
  );

  public deleteUsers = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/users', 'DELETE', WITH_BODY, ids => JSON.stringify({ users: ids }));

  // Domain methods

  public createDomain = this.manufactureMethod<
    [string, boolean | undefined],
    Cumulonimbus.Data.Domain
  >('/domain', 'POST', WITH_BODY, (domain, allowsSubdomains) => {
    if (allowsSubdomains !== undefined)
      return JSON.stringify({ domain, allowsSubdomains });
    else return JSON.stringify({ domain });
  });

  public editDomain = this.manufactureMethod<
    [string, boolean],
    Cumulonimbus.Data.Domain
  >(
    (domain, allowsSubdomains) => `/domain/${domain}`,
    'PATCH',
    WITH_BODY,
    (domain, allowsSubdomains) => JSON.stringify({ allowsSubdomains })
  );

  public deleteDomain = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Domain
  >(domain => `/domain/${domain}`, 'DELETE');

  public deleteDomains = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/domains', 'DELETE', WITH_BODY, domains => JSON.stringify({ domains }));

  // File methods

  public getFiles = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.File>
  >((limit, offset) => `/files${this.toQueryString({ limit, offset })}`);

  public getUserFiles = this.manufactureMethodGet<
    [string, number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.File>
  >(
    (user, limit, offset) =>
      `/user/${user}/files${this.toQueryString({ limit, offset })}`
  );

  public getFile = this.manufactureMethodGet<[string], Cumulonimbus.Data.File>(
    file => `/file/${file}`
  );

  public deleteFile = this.manufactureMethod<[string], Cumulonimbus.Data.File>(
    file => `/file/${file}`,
    'DELETE'
  );

  public deleteFiles = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/files', 'DELETE', WITH_BODY, files => JSON.stringify({ files }));

  public deleteAllUserFiles = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.DeleteBulk
  >(user => `/user/${user}/files/all`, 'DELETE');

  // Instruction methods

  public createInstruction = this.manufactureMethod<
    [string, string, string, string, string[], string | undefined],
    Cumulonimbus.Data.Instruction
  >(
    '/instruction',
    'POST',
    WITH_BODY,
    (name, displayName, description, configContent, steps, configFilename) => {
      if (configFilename)
        return JSON.stringify({
          name,
          displayName,
          description,
          fileContent: configContent,
          steps,
          filename: configFilename
        });
      else
        return JSON.stringify({
          name,
          displayName,
          description,
          fileContent: configContent,
          steps
        });
    }
  );

  public editInstruction = this.manufactureMethod<
    [
      string,
      {
        displayName?: string;
        description?: string;
        fileContent?: string;
        steps?: string[];
        filename?: string;
      }
    ],
    Cumulonimbus.Data.Instruction
  >(
    (id, data) => `/instruction/${id}`,
    'PATCH',
    WITH_BODY,
    (id, data) => {
      if (data.filename)
        return JSON.stringify({ ...data, filename: data.filename });
      else return JSON.stringify({ ...data });
    }
  );

  public deleteInstruction = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Instruction
  >(id => `/instruction/${id}`, 'DELETE');

  public deleteInstructions = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.DeleteBulk
  >('/instructions', 'DELETE', WITH_BODY, ids =>
    JSON.stringify({ instructions: ids })
  );

  // Session methods

  public getUserSessions = this.manufactureMethodGet<
    [string, number | undefined, number | undefined],
    Cumulonimbus.Data.List<Cumulonimbus.Data.Session>
  >(
    (user, limit, offset) =>
      `/user/${user}/sessions${this.toQueryString({ limit, offset })}`
  );

  public getUserSession = this.manufactureMethodGet<
    [string, string],
    Cumulonimbus.Data.Session
  >((user, session) => `/user/${user}/session/${session}`);

  public deleteUserSession = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.Session
  >((user, session) => `/user/${user}/session/${session}`, 'DELETE');

  public deleteUserSessions = this.manufactureMethod<
    [string, string[]],
    Cumulonimbus.Data.DeleteBulk
  >(
    (user, sessions) => `/user/${user}/sessions`,
    'DELETE',
    WITH_BODY,
    sessions => JSON.stringify({ sessions })
  );

  public deleteAllUserSessions = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.DeleteBulk
  >(user => `/user/${user}/sessions/all`, 'DELETE');
}

namespace Cumulonimbus {
  export const BASE_URL = 'https://alekeagle.me/api';
  export const BASE_THUMB_URL = 'https://previews.alekeagle.me';
  export const VERSION = version;

  export interface RatelimitData {
    max: number;
    remaining: number;
    reset: number;
  }

  export interface ClientOptions {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  export interface APICallRequestInit extends RequestInit {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  export interface APIResponse<T> {
    result: T;
    ratelimit: RatelimitData | null;
    response: Response;
  }

  export namespace Data {
    export interface List<T> {
      count: number;
      items: T[];
    }

    export interface Error {
      code: string;
      message: string;
    }

    export interface Success {
      code: string;
      message?: string;
    }

    export interface User {
      id: string;
      username: string;
      email: string;
      staff: boolean;
      domain: string;
      subdomain?: string;
      bannedAt?: string;
      createdAt: string;
      updatedAt: string;
    }

    export interface Session {
      iat: number;
      exp: number;
      sub: string;
      name: string;
    }

    export interface Domain {
      domain: string;
      allowsSubdomains: boolean;
      createdAt: string;
      updatedAt: string;
    }

    export type DomainSlim = Omit<Domain, 'createdAt' | 'updatedAt'>;

    export interface File {
      filename: string;
      createdAt: string;
      updatedAt: string;
      userID: string;
      size: number;
    }

    export interface DeleteBulk {
      count: number;
      type: 'user' | 'session' | 'file' | 'domain' | 'instruction';
    }

    export interface Instruction {
      name: string;
      steps: string[];
      filename: string;
      fileContent: string;
      description: string;
      displayName: string;
      createdAt: string;
      updatedAt: string;
    }

    export interface SuccessfulAuth {
      token: string;
      exp: number;
    }

    export interface SuccessfulUpload {
      url: string;
      thumbnail: string;
      manage: string;
    }

    export interface SanityCheck {
      version: string;
      hello: 'world';
    }
  }

  export interface ErrorCode {
    INSUFFICIENT_PERMISSIONS_ERROR: 'Missing Permissions';
    INVALID_USER_ERROR: 'Invalid User';
    INVALID_PASSWORD_ERROR: 'Invalid Password';
    INVALID_SESSION_ERROR: 'Invalid Session';
    INVALID_DOMAIN_ERROR: 'Invalid Domain';
    INVALID_SUBDOMAIN_ERROR: 'Invalid Subdomain: <subdomain>';
    INVALID_FILE_ERROR: 'Invalid File';
    INVALID_INSTRUCTION_ERROR: 'Invalid Instruction';
    INVALID_ENDPOINT_ERROR: 'Invalid Endpoint';
    SUBDOMAIN_NOT_SUPPORTED_ERROR: 'Subdomain Not Supported';
    DOMAIN_EXISTS_ERROR: 'Domain Exists';
    USER_EXISTS_ERROR: 'User Exists';
    INSTRUCTION_EXISTS_ERROR: 'Instruction Exists';
    MISSING_FIELDS_ERROR: 'Missing Fields: <fields>';
    BANNED_ERROR: 'Banned';
    BODY_TOO_LARGE_ERROR: 'Body Too Large';
    RATELIMITED_ERROR: 'You Have Been Ratelimited. Please Try Again Later.';
    INTERNAL_ERROR: 'Internal Server Error';
    GENERIC_ERROR: '<message>';
  }

  export class ResponseError extends Error implements Data.Error {
    code: keyof ErrorCode;
    message: ErrorCode[keyof ErrorCode];
    ratelimit: RatelimitData | null;
    constructor(response: Data.Error, ratelimit: RatelimitData | null = null) {
      super(response.message);
      Object.setPrototypeOf(this, ResponseError.prototype);
      this.code = response.code as keyof ErrorCode;
      this.message = response.message as ErrorCode[keyof ErrorCode];
      this.ratelimit = ratelimit;
    }
  }

  export class ThumbnailError extends Error {
    code: number;
    message: string;
    constructor(response: Response) {
      super(response.statusText);
      Object.setPrototypeOf(this, ThumbnailError.prototype);
      this.code = response.status;
      this.message = response.statusText;
    }
  }
}

export default Cumulonimbus;
