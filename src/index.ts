// Hard-code the version number, because it's not worth the effort to automate it
const version = '3.0.3';

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
  'Content-Type': 'application/json',
};

const USER_AGENT =
  globalThis.navigator && globalThis.navigator.userAgent
    ? globalThis.navigator.userAgent
    : `Cumulonimbus-Wrapper/${version}`;

class Cumulonimbus {
  private token: string;
  private options: Cumulonimbus.ClientOptions;
  private userAgent: string = USER_AGENT;

  constructor(token: string, options?: Cumulonimbus.ClientOptions) {
    this.token = token;
    this.options = options || {};
  }

  private async call<T>(
    endpoint: string,
    options: Cumulonimbus.APICallRequestInit = {},
  ): Promise<Cumulonimbus.APIResponse<T>> {
    const opts = merge(options, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    const res = await fetch(
      (options.baseURL || this.options.baseURL || Cumulonimbus.BASE_URL) +
        endpoint,
      opts,
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get('Ratelimit-Limit')) {
      ratelimit = {
        limit: Number(res.headers.get('Ratelimit-Limit')),
        remaining: Number(res.headers.get('Ratelimit-Remaining')),
        reset: Number(res.headers.get('Ratelimit-Reset')),
      };
    }

    // Check if the response is a 413, and if so, construct a new BODY_TOO_LARGE error, as we can't be sure the server returns a proper error
    if (res.status === 413) {
      throw new Cumulonimbus.ResponseError(
        {
          code: 'BODY_TOO_LARGE_ERROR',
          message: 'Body Too Large',
        },
        ratelimit,
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
            code: 'INTERNAL_ERROR',
            message: 'Internal Server Error',
          },
          ratelimit,
        );
    }
  }

  private async authenticatedCall<T>(
    url: string,
    options: Cumulonimbus.APICallRequestInit = {},
  ) {
    const opts = merge(options, {
      headers: {
        Authorization: this.token,
      },
    });
    return this.call<T>(url, opts);
  }

  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers: { [key: string]: string } = {},
    bodyTemplate: string | null | ((...args: T) => string) = null,
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
            : () => bodyTemplate)(...args),
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
    headers: { [key: string]: string } = {},
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>> {
    return this.manufactureMethod<T, M>(endpointTemplate, 'GET', headers, null);
  }

  private toQueryString(params: {
    [key: string]: string | number | boolean;
  }): string {
    if (
      Object.entries(params).filter(
        ([key, value]) => value !== null && value !== '' && value !== undefined,
      ).length === 0
    )
      return '';
    else
      return (
        '?' +
        Object.entries(params)
          .filter(
            ([key, value]) =>
              value !== null && value !== '' && value !== undefined,
          )
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
          )
          .join('&')
      );
  }

  public static async login(
    username: string,
    password: string,
    rememberMe: boolean = false,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string,
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };
    if (tokenName) headers['X-Token-Name'] = tokenName;
    const res = await fetch(
      (options && options.baseURL ? options.baseURL : Cumulonimbus.BASE_URL) +
        '/login',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username,
          password,
          rememberMe,
        }),
      },
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get('Ratelimit-Limit')) {
      ratelimit = {
        limit: Number(res.headers.get('Ratelimit-Limit')),
        remaining: Number(res.headers.get('Ratelimit-Remaining')),
        reset: Number(res.headers.get('Ratelimit-Reset')),
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
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent':
        globalThis.navigator && globalThis.navigator.userAgent
          ? globalThis.navigator.userAgent
          : `Cumulonimbus-Wrapper/${version}`,
    };
    const res = await fetch(
      (options && options.baseURL ? options.baseURL : Cumulonimbus.BASE_URL) +
        '/register',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          rememberMe,
        }),
      },
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get('Ratelimit-Limit')) {
      ratelimit = {
        limit: Number(res.headers.get('Ratelimit-Limit')),
        remaining: Number(res.headers.get('Ratelimit-Remaining')),
        reset: Number(res.headers.get('Ratelimit-Reset')),
      };
    }

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, options);
  }

  // API Status Methods

  public static async getAPIStatus(
    options?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus> {
    const res = await fetch(
      options && options.baseURL
        ? options.baseURL
        : Cumulonimbus.BASE_URL + '/',
    );
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      });
    else return await res.json();
  }

  public static async getThumbnailAPIStatus(
    options?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus> {
    const res = await fetch(
      options && options.baseThumbnailURL
        ? options.baseThumbnailURL
        : Cumulonimbus.BASE_THUMBNAIL_URL + '/',
    );
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      });
    else return await res.json();
  }

  // Get Thumbnail

  public async getThumbnail(
    id: string | Cumulonimbus.Data.File,
  ): Promise<ArrayBuffer> {
    const fileID = typeof id === 'string' ? id : id.id;
    const res = await fetch(`${this.options.baseThumbnailURL}/${fileID}`);
    if (!res.ok) throw new Cumulonimbus.ThumbnailError(res);
    else return await res.arrayBuffer();
  }

  // Session Methods
  public getSession = this.manufactureMethodGet<
    [string | undefined, string | undefined],
    Cumulonimbus.Data.Session
  >((sid, uid) => `/users/${uid || 'me'}/sessions/${sid || 'me'}`);

  public getSessions = this.manufactureMethodGet<
    [string | undefined, number | undefined, number | undefined],
    Cumulonimbus.Data.List<Exclude<Cumulonimbus.Data.Session, 'exp'>>
  >(
    (uid, limit, offset) =>
      `/users/${uid || 'me'}/sessions${this.toQueryString({ limit, offset })}`,
  );

  public deleteSession = this.manufactureMethod<
    [string, string | undefined],
    Cumulonimbus.Data.Success
  >((sid, uid) => `/users/${uid || 'me'}/sessions/${sid || 'me'}`, 'DELETE');

  public deleteSessions = this.manufactureMethod<
    [string[], string | undefined],
    Cumulonimbus.Data.Success
  >(
    (_, uid) => `/users/${uid || 'me'}/sessions`,
    'DELETE',
    WITH_BODY,
    (sids, uid) => {
      return JSON.stringify({ sids });
    },
  );

  public deleteAllSessions = this.manufactureMethod<
    [string | undefined, boolean | undefined],
    Cumulonimbus.Data.Success
  >(
    (uid, includeSelf) =>
      `/users/${uid || 'me'}/sessions/all?include-self=${includeSelf || false}`,
    'DELETE',
  );

  // User Methods

  public getUsers = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.User, 'id' | 'username'>>
  >((limit, offset) => `/users${this.toQueryString({ limit, offset })}`);

  public getUser = this.manufactureMethodGet<
    [string | undefined],
    Cumulonimbus.Data.User
  >((uid) => `/users/${uid || 'me'}`);

  public editUsername = this.manufactureMethod<
    [string, string | undefined, string | undefined],
    Cumulonimbus.Data.User
  >(
    (username, password, uid) => `/users/${uid || 'me'}/username`,
    'PUT',
    WITH_BODY,
    (username, password, uid) => {
      return JSON.stringify({ username, password });
    },
  );

  public editEmail = this.manufactureMethod<
    [string, string | undefined, string | undefined],
    Cumulonimbus.Data.User
  >(
    (email, password, uid) => `/users/${uid || 'me'}/email`,
    'PUT',
    WITH_BODY,
    (email, password, uid) => {
      return JSON.stringify({ email, password });
    },
  );

  public verifyEmail = this.manufactureMethod<
    [string, string | undefined],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid || 'me'}/verify`,
    'PUT',
    WITH_BODY,
    (uid, token) => {
      return !!token ? JSON.stringify({ token }) : undefined;
    },
  );

  public resendVerificationEmail = this.manufactureMethodGet<
    [string | undefined],
    Cumulonimbus.Data.Success
  >((uid) => `/users/${uid || 'me'}/verify`);

  public unverifyEmail = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.User
  >((uid) => `/users/${uid}/verify`, 'DELETE');

  public editPassword = this.manufactureMethod<
    [string, string, string | undefined, string | undefined],
    Cumulonimbus.Data.User
  >(
    (newPassword, confirmNewPassword, oldPassword, uid) =>
      `/users/${uid || 'me'}/password`,
    'PUT',
    WITH_BODY,
    (newPassword, confirmNewPassword, oldPassword, uid) => {
      return JSON.stringify({
        newPassword,
        confirmNewPassword,
        password: oldPassword,
      });
    },
  );

  public grantStaff = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    (uid) => `/users/${uid}/staff`,
    'PUT',
  );

  public revokeStaff = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    (uid) => `/users/${uid}/staff`,
    'DELETE',
  );

  public banUser = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/ban`,
    'PUT',
    WITH_BODY,
    (uid, reason) => {
      return JSON.stringify({ reason });
    },
  );

  public unbanUser = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    (uid) => `/users/${uid}/ban`,
    'DELETE',
  );

  public editDomainSelection = this.manufactureMethod<
    [string, string | undefined, string | undefined],
    Cumulonimbus.Data.User
  >(
    (domain, subdomain, uid) => `/users/${uid || 'me'}/domain`,
    'PUT',
    WITH_BODY,
    (domain, subdomain, uid) => {
      return JSON.stringify({ domain, subdomain });
    },
  );

  public deleteUser = this.manufactureMethod<
    [string | undefined, string | undefined, string | undefined],
    Cumulonimbus.Data.Success
  >(
    (uid, username, password) => `/users/${uid || 'me'}`,
    'DELETE',
    WITH_BODY,
    (uid, username, password) => {
      return JSON.stringify({ username, password });
    },
  );

  public deleteUsers = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success
  >('/users', 'DELETE', WITH_BODY, (ids) => {
    return JSON.stringify({ ids });
  });

  // Domain Methods

  public getDomains = this.manufactureMethodGet<
    ['all' | number | undefined, number | undefined],
    Cumulonimbus.Data.List<
      Extract<Cumulonimbus.Data.Domain, 'id' | 'subdomains'>
    >
  >(
    (limit, offset) =>
      `/domains${this.toQueryString({
        limit: limit === 'all' ? -1 : limit,
        offset: limit === 'all' ? undefined : offset,
      })}`,
  );

  public getDomain = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Domain
  >((id) => `/domains/${id}`);

  public createDomain = this.manufactureMethod<
    [string, boolean | undefined],
    Cumulonimbus.Data.Domain
  >('/domains', 'POST', WITH_BODY, (id, subdomains) => {
    return JSON.stringify({ id, subdomains });
  });

  public allowSubdomains = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Domain
  >((id) => `/domains/${id}/subdomains`, 'PUT');

  public disallowSubdomains = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Domain
  >((id) => `/domains/${id}/subdomains`, 'DELETE');

  public deleteDomain = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Success
  >((id) => `/domains/${id}`, 'DELETE');

  public deleteDomains = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success
  >('/domains', 'DELETE', WITH_BODY, (ids) => {
    return JSON.stringify({ ids });
  });

  // File Methods

  public getFiles = this.manufactureMethodGet<
    [string | undefined, number | undefined, number | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.File, 'id' | 'name'>>
  >((uid, limit, offset) => {
    return `/files${this.toQueryString({
      uid,
      limit,
      offset,
    })}`;
  });

  public getFile = this.manufactureMethodGet<[string], Cumulonimbus.Data.File>(
    (id) => `/files/${id}`,
  );

  public editFilename = this.manufactureMethod<
    [string, string | undefined],
    Cumulonimbus.Data.File
  >(
    (id, name) => `/files/${id}/name`,
    'PUT',
    WITH_BODY,
    (id, name) => {
      return JSON.stringify({ name });
    },
  );

  public editFileExtension = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.File
  >(
    (id, extension) => `/files/${id}/extension`,
    'PUT',
    WITH_BODY,
    (id, extension) => {
      return JSON.stringify({ extension });
    },
  );

  public deleteFile = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Success
  >((id) => `/files/${id}`, 'DELETE');

  public deleteFiles = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success
  >('/files', 'DELETE', WITH_BODY, (ids) => {
    return JSON.stringify({ ids });
  });

  public deleteAllFiles = this.manufactureMethod<
    [string | undefined, string | undefined],
    Cumulonimbus.Data.Success
  >(
    (user, password) => `/files/all${this.toQueryString({ user })}`,
    'DELETE',
    WITH_BODY,
    (user, password) => {
      return JSON.stringify({ password });
    },
  );

  // Instruction Methods

  public getInstructions = this.manufactureMethodGet<
    [number | undefined, number | undefined],
    Cumulonimbus.Data.List<
      Extract<Cumulonimbus.Data.Instruction, 'id' | 'name' | 'description'>
    >
  >((limit, offset) => {
    return `/instructions${this.toQueryString({
      limit,
      offset,
    })}`;
  });

  public getInstruction = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Instruction
  >((id) => `/instructions/${id}`);

  public createInstruction = this.manufactureMethod<
    [string, string, string, string[], string, string | undefined],
    Cumulonimbus.Data.Instruction
  >(
    '/instructions',
    'POST',
    WITH_BODY,
    (id, name, description, steps, content, filename) => {
      return JSON.stringify({
        id,
        name,
        description,
        steps,
        content,
        filename,
      });
    },
  );

  public editInstructionName = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.Instruction
  >(
    (id, name) => `/instructions/${id}/name`,
    'PUT',
    WITH_BODY,
    (id, name) => {
      return JSON.stringify({ name });
    },
  );

  public editInstructionDescription = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.Instruction
  >(
    (id, description) => `/instructions/${id}/description`,
    'PUT',
    WITH_BODY,
    (id, description) => {
      return JSON.stringify({ description });
    },
  );

  public editInstructionFile = this.manufactureMethod<
    [string, string, string | undefined],
    Cumulonimbus.Data.Instruction
  >(
    (id, content, filename) => `/instructions/${id}/file`,
    'PUT',
    WITH_BODY,
    (id, content, filename) => {
      return JSON.stringify({ content, filename });
    },
  );

  public editInstructionSteps = this.manufactureMethod<
    [string, string[]],
    Cumulonimbus.Data.Instruction
  >(
    (id, steps) => `/instructions/${id}/steps`,
    'PUT',
    WITH_BODY,
    (id, steps) => {
      return JSON.stringify({ steps });
    },
  );

  public deleteInstruction = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.Success
  >((id) => `/instructions/${id}`, 'DELETE');

  public deleteInstructions = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success
  >('/instructions', 'DELETE', WITH_BODY, (ids) => {
    return JSON.stringify({ ids });
  });

  // Upload Method

  public async upload(
    file: string | Buffer | File | Blob | ArrayBuffer,
    type?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SuccessfulUpload>> {
    const formData = new FormData();
    if (typeof file === 'string') {
      formData.append('file', new Blob([file], { type: type || 'text/plain' }));
    } else if (globalThis.Buffer && file instanceof globalThis.Buffer) {
      formData.append(
        'file',
        new Blob([file], { type: type || 'application/octet-stream' }),
      );
    } else if (file instanceof File) {
      formData.append('file', file);
    } else if (file instanceof Blob) {
      formData.append('file', file);
    } else if (file instanceof ArrayBuffer) {
      formData.append(
        'file',
        new Blob([file], { type: type || 'application/octet-stream' }),
      );
    } else {
      throw new Error('Invalid file type');
    }
    const res =
      await this.authenticatedCall<Cumulonimbus.Data.SuccessfulUpload>(
        '/upload',
        {
          method: 'POST',
          body: formData,
        },
      );
    return res;
  }
}

namespace Cumulonimbus {
  export const BASE_URL = 'https://alekeagle.me/api';
  export const BASE_THUMBNAIL_URL = 'https://previews.alekeagle.me';
  export const VERSION = version;

  export interface RatelimitData {
    limit: number;
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
    export interface User {
      id: string;
      username: string;
      email: string;
      verified: boolean;
      staff: boolean;
      domain: string;
      subdomain: string | null;
      bannedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }

    export interface Session {
      id: number;
      exp: number;
      name: string;
    }

    export interface List<T> {
      count: number;
      items: T[];
    }

    export interface Success {
      code: keyof SuccessCode;
      message: SuccessCode[keyof SuccessCode];
    }

    export interface Instruction {
      id: string;
      name: string;
      description: string;
      steps: string[];
      filename: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }

    export interface Domain {
      id: string;
      subdomains: boolean;
      createdAt: string;
      updatedAt: string;
    }

    export interface Error {
      code: keyof ErrorCode;
      message: ErrorCode[keyof ErrorCode];
      fields?: string[];
    }

    export interface SuccessfulAuth {
      token: string;
      exp: number;
    }

    export interface File {
      id: string;
      userID: string;
      size: number;
      createdAt: string;
      updatedAt: string;
    }

    export interface SuccessfulUpload {
      url: string;
      thumbnail: string;
      manage: string;
    }

    export interface APIStatus {
      version: string;
      hello: 'world';
    }
  }

  export interface ErrorCode {
    INSUFFICIENT_PERMISSIONS_ERROR: 'Insufficient Permissions';
    INVALID_USER_ERROR: 'Invalid User';
    INVALID_USERNAME_ERROR: 'Invalid Username';
    INVALID_PASSWORD_ERROR: 'Invalid Password';
    PASSWORDS_DO_NOT_MATCH_ERROR: 'Passwords Do Not Match';
    INVALID_EMAIL_ERROR: 'Invalid Email';
    INVALID_SESSION_ERROR: 'Invalid Session';
    INVALID_DOMAIN_ERROR: 'Invalid Domain';
    SUBDOMAIN_TOO_LONG_ERROR: 'Subdomain Too Long';
    INVALID_FILE_ERROR: 'Invalid File';
    INVALID_INSTRUCTION_ERROR: 'Invalid Instruction';
    INVALID_ENDPOINT_ERROR: 'Invalid Endpoint';
    SUBDOMAIN_NOT_ALLOWED_ERROR: 'Subdomain Not Allowed';
    DOMAIN_EXISTS_ERROR: 'Domain Exists';
    USER_EXISTS_ERROR: 'User Exists';
    INSTRUCTION_EXISTS_ERROR: 'Instruction Exists';
    MISSING_FIELDS_ERROR: 'Missing Fields';
    BANNED_ERROR: 'Banned';
    BODY_TOO_LARGE_ERROR: 'Body Too Large';
    RATELIMITED_ERROR: 'You Have Been Ratelimited. Please Try Again Later.';
    INTERNAL_ERROR: 'Internal Server Error';
  }

  export interface SuccessCode {
    DELETE_USER_SUCCESS: 'User Successfully Deleted';
    DELETE_USERS_SUCCESS: 'Users Successfully Deleted';
    DELETE_FILE_SUCCESS: 'File Successfully Deleted';
    DELETE_FILES_SUCCESS: 'Files Successfully Deleted';
    DELETE_SESSION_SUCCESS: 'Session Successfully Deleted';
    DELETE_SESSIONS_SUCCESS: 'Sessions Successfully Deleted';
    DELETE_DOMAIN_SUCCESS: 'Domain Successfully Deleted';
    DELETE_DOMAINS_SUCCESS: 'Domains Successfully Deleted';
    DELETE_INSTRUCTION_SUCCESS: 'Instruction Successfully Deleted';
    DELETE_INSTRUCTIONS_SUCCESS: 'Instructions Successfully Deleted';
  }

  export class ResponseError extends Error implements Data.Error {
    code: keyof ErrorCode;
    message: ErrorCode[keyof ErrorCode];
    ratelimit: RatelimitData | null;
    fields?: string[];
    constructor(response: Data.Error, ratelimit: RatelimitData | null = null) {
      super(response.message as string);
      Object.setPrototypeOf(this, ResponseError.prototype);
      this.code = response.code as keyof ErrorCode;
      this.message = response.message as ErrorCode[keyof ErrorCode];
      this.ratelimit = ratelimit;
      if (this.code === 'MISSING_FIELDS_ERROR') {
        this.fields = response.fields;
      }
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
