// Hard-code the version number, because it's not worth the effort to automate it
const version = '4.0.5';

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
  private userAgent: string = USER_AGENT;

  constructor(token: string, private options: Cumulonimbus.ClientOptions = {}) {
    this.token = token;
  }

  //  Get the ratelimit headers from a response
  private static getRatelimitHeaders(
    res: Response,
  ): Cumulonimbus.RatelimitData | null {
    if (res.headers.get('Ratelimit-Limit')) {
      return {
        limit: Number(res.headers.get('Ratelimit-Limit')),
        remaining: Number(res.headers.get('Ratelimit-Remaining')),
        reset: Number(res.headers.get('Ratelimit-Reset')),
      };
    } else return null;
  }

  // Call an endpoint from the Cumulonimbus API
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

    let ratelimit = Cumulonimbus.getRatelimitHeaders(res);

    // Check if the response is a 413, and if so, construct a new BODY_TOO_LARGE error, as we can't be sure the server returns a proper error (Thanks, Cloudflare!)
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
      // If we error for whatever reason, just throw the error we catch.
      throw error;
    }
  }

  // Call an endpoint from the Cumulonimbus API, but with an Authorization header
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

  // Our factory method for creating methods
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

  // Our factory method for creating GET methods
  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    headers: { [key: string]: string } = {},
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>> {
    return this.manufactureMethod<T, M>(endpointTemplate, 'GET', headers, null);
  }

  // Convert an object to a query string
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
    options: {
      username: string;
      password: string;
      rememberMe?: boolean;
      tokenName?: string;
    },
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };
    if (options.tokenName) headers['X-Token-Name'] = options.tokenName;
    const res = await fetch(
      (options && clientOptions.baseURL
        ? clientOptions.baseURL
        : Cumulonimbus.BASE_URL) + '/login',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: options.username,
          password: options.password,
          rememberMe: options.rememberMe || false,
        }),
      },
    );

    let ratelimit = Cumulonimbus.getRatelimitHeaders(res);

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, clientOptions);
  }

  public static async register(
    options: {
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      rememberMe?: boolean;
    },
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent':
        globalThis.navigator && globalThis.navigator.userAgent
          ? globalThis.navigator.userAgent
          : `Cumulonimbus-Wrapper/${version}`,
    };
    const res = await fetch(
      (clientOptions && clientOptions.baseURL
        ? clientOptions.baseURL
        : Cumulonimbus.BASE_URL) + '/register',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: options.username,
          email: options.email,
          password: options.password,
          confirmPassword: options.confirmPassword,
          rememberMe: options.rememberMe || false,
        }),
      },
    );

    let ratelimit = Cumulonimbus.getRatelimitHeaders(res);

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, clientOptions);
  }

  // API Status Methods

  public static async getAPIStatus(
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus> {
    const res = await fetch(
      clientOptions && clientOptions.baseURL
        ? clientOptions.baseURL
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
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus> {
    const res = await fetch(
      clientOptions && clientOptions.baseThumbnailURL
        ? clientOptions.baseThumbnailURL
        : Cumulonimbus.BASE_THUMBNAIL_URL + '/',
    );
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      });
    else return await res.json();
  }

  //-- Instance Methods --//

  // Get Thumbnail

  public async getThumbnail(
    id: string | Cumulonimbus.Data.File,
  ): Promise<ArrayBuffer> {
    const fileID = typeof id === 'string' ? id : id.id;
    const res = await fetch(`${this.options.baseThumbnailURL}/${fileID}`);
    if (!res.ok) throw new Cumulonimbus.ThumbnailError(res);
    else return await res.arrayBuffer();
  }

  // Status Methods, but for the instance, eliminating the need to pass in options
  public async getAPIStatus(): Promise<Cumulonimbus.Data.APIStatus> {
    return await Cumulonimbus.getAPIStatus(this.options);
  }

  public async getThumbnailAPIStatus(): Promise<Cumulonimbus.Data.APIStatus> {
    return await Cumulonimbus.getThumbnailAPIStatus(this.options);
  }

  // Session Methods
  public getSession = this.manufactureMethodGet<
    [
      | undefined
      | string
      | { session?: string; user: undefined }
      | { session: string; user: string },
    ],
    Cumulonimbus.Data.Session
  >((options) => {
    if (typeof options === 'string') {
      return `/users/me/sessions/${options}`;
    } else {
      return `/users/${options?.user || 'me'}/sessions/${
        options?.session || 'me'
      }`;
    }
  });

  public getSessions = this.manufactureMethodGet<
    [undefined | string | { user?: string; limit?: number; offset?: number }],
    Cumulonimbus.Data.List<Exclude<Cumulonimbus.Data.Session, 'exp'>>
  >((options) => {
    if (typeof options === 'string') {
      return `/users/${options}/sessions`;
    } else {
      return `/users/${options?.user || 'me'}/sessions${this.toQueryString({
        limit: options?.limit,
        offset: options?.offset,
      })}`;
    }
  });

  public deleteSession = this.manufactureMethod<
    [
      | undefined
      | string
      | { session?: string; user: undefined }
      | { session: string; user: string },
    ],
    Cumulonimbus.Data.Success
  >((options) => {
    switch (typeof options) {
      case 'string':
        return `/users/me/sessions/${options}`;
      case 'object':
        return `/users/${options.user || 'me'}/sessions/${
          options.session || 'me'
        }`;
      default:
        return `/users/me/sessions/me`;
    }
  }, 'DELETE');

  public deleteSessions = this.manufactureMethod<
    [string[], string | undefined],
    Cumulonimbus.Data.Success
  >(
    (_, user) => `/users/${user || 'me'}/sessions`,
    'DELETE',
    WITH_BODY,
    (sessionIDs) => {
      return JSON.stringify({ ids: sessionIDs });
    },
  );

  public deleteAllSessions = this.manufactureMethod<
    [undefined | string | boolean],
    Cumulonimbus.Data.Success
  >((userOrIncludeSelf) => {
    switch (typeof userOrIncludeSelf) {
      case 'string':
        return `/users/${userOrIncludeSelf}/sessions/all`;
      case 'boolean':
        return `/users/me/sessions/all${this.toQueryString({
          includeSelf: userOrIncludeSelf,
        })}`;
      default:
        return `/users/me/sessions/all`;
    }
  }, 'DELETE');

  // User Methods

  public getUsers = this.manufactureMethodGet<
    [{ limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.User, 'id' | 'username'>>
  >((options) => `/users${this.toQueryString(options)}`);

  public getUser = this.manufactureMethodGet<
    [string | undefined],
    Cumulonimbus.Data.User
  >((user) => `/users/${user || 'me'}`);

  public editUsername = this.manufactureMethod<
    [
      | {
          username: string;
          password: string;
          user: undefined;
        }
      | {
          username: string;
          password: undefined;
          user: string;
        },
    ],
    Cumulonimbus.Data.User
  >(
    (options) => `/users/${options.user || 'me'}/username`,
    'PUT',
    WITH_BODY,
    (options) => {
      const { username, password } = options;
      return JSON.stringify({
        username,
        password,
      });
    },
  );

  public editEmail = this.manufactureMethod<
    [
      | {
          email: string;
          password: string;
          user: undefined;
        }
      | {
          email: string;
          password: undefined;
          user: string;
        },
    ],
    Cumulonimbus.Data.User
  >(
    (options) => `/users/${options.user || 'me'}/email`,
    'PUT',
    WITH_BODY,
    (options) => {
      const { email, password } = options;
      return JSON.stringify({
        email,
        password,
      });
    },
  );

  public verifyEmail = this.manufactureMethod<
    [
      | {
          user: undefined;
          token: string;
        }
      | {
          user: string;
          token: undefined;
        },
    ],
    Cumulonimbus.Data.User
  >(
    (options) => `/users/${options.user || 'me'}/verify`,
    'PUT',
    WITH_BODY,
    (options) => {
      const { token } = options;
      return JSON.stringify({
        token,
      });
    },
  );

  public resendVerificationEmail = this.manufactureMethodGet<
    [string | undefined],
    Cumulonimbus.Data.Success
  >((user) => `/users/${user || 'me'}/verify`);

  public unverifyEmail = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.User
  >((uid) => `/users/${uid}/verify`, 'DELETE');

  public editPassword = this.manufactureMethod<
    [
      | {
          newPassword: string;
          confirmNewPassword: string;
          password: string;
          user: undefined;
        }
      | {
          newPassword: string;
          confirmNewPassword: string;
          password: undefined;
          user: string;
        },
    ],
    Cumulonimbus.Data.User
  >(
    (options) => `/users/${options.user || 'me'}/password`,
    'PUT',
    WITH_BODY,
    (options) => {
      const { newPassword, confirmNewPassword, password } = options;

      return JSON.stringify({
        newPassword,
        confirmNewPassword,
        password,
      });
    },
  );

  public grantStaff = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    (user) => `/users/${user}/staff`,
    'PUT',
  );

  public revokeStaff = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    (user) => `/users/${user}/staff`,
    'DELETE',
  );

  public banUser = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.User
  >(
    (user) => `/users/${user}/ban`,
    'PUT',
    WITH_BODY,
    (_, reason) => {
      return JSON.stringify({ reason });
    },
  );

  public unbanUser = this.manufactureMethod<[string], Cumulonimbus.Data.User>(
    (user) => `/users/${user}/ban`,
    'DELETE',
  );

  public editDomainSelection = this.manufactureMethod<
    [{ domain: string; subdomain?: string }, string | undefined],
    Cumulonimbus.Data.User
  >(
    (_, user) => `/users/${user || 'me'}/domain`,
    'PUT',
    WITH_BODY,
    (options) => {
      return JSON.stringify(options);
    },
  );

  public deleteUser = this.manufactureMethod<
    [
      | {
          user: undefined;
          username: string;
          password: string;
        }
      | {
          user: string;
          username: undefined;
          password: undefined;
        },
    ],
    Cumulonimbus.Data.Success
  >(
    (options) => `/users/${options.user || 'me'}`,
    'DELETE',
    WITH_BODY,
    (options) => {
      const { username, password } = options;
      return JSON.stringify({
        username,
        password,
      });
    },
  );

  public deleteUsers = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success
  >('/users', 'DELETE', WITH_BODY, (userIDs) => {
    return JSON.stringify({ ids: userIDs });
  });

  // Domain Methods

  public getDomains = this.manufactureMethodGet<
    [
      {
        limit?: number | 'all';
        offset?: number;
      },
    ],
    Cumulonimbus.Data.List<
      Extract<Cumulonimbus.Data.Domain, 'id' | 'subdomains'>
    >
  >((options) => {
    const { limit, offset } = options || {};
    return `/domains${this.toQueryString({
      limit: limit === 'all' ? -1 : limit,
      offset: limit === 'all' ? undefined : offset,
    })}`;
  });

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
  >('/domains', 'DELETE', WITH_BODY, (domainIDs) => {
    return JSON.stringify({ ids: domainIDs });
  });

  // File Methods

  public getFiles = this.manufactureMethodGet<
    [{ user?: string; limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.File, 'id' | 'name'>>
  >((options) => {
    const { user: uid, limit, offset } = options || {};
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
    [string, string],
    Cumulonimbus.Data.File
  >(
    (id) => `/files/${id}/name`,
    'PUT',
    WITH_BODY,
    (_, name) => {
      return JSON.stringify({ name });
    },
  );

  public deleteFilename = this.manufactureMethod<
    [string],
    Cumulonimbus.Data.File
  >((id) => `/files/${id}/name`, 'DELETE');

  public editFileExtension = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.File
  >(
    (id) => `/files/${id}/extension`,
    'PUT',
    WITH_BODY,
    (_, extension) => {
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
    [
      | { user: string; password: undefined }
      | { user: undefined; password: string },
    ],
    Cumulonimbus.Data.Success
  >(
    (options) => {
      const { user } = options;
      return `/files/all${this.toQueryString({ user })}`;
    },
    'DELETE',
    WITH_BODY,
    (options) => {
      const { password } = options;
      return JSON.stringify({ password });
    },
  );

  // Instruction Methods

  public getInstructions = this.manufactureMethodGet<
    [{ limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<
      Extract<Cumulonimbus.Data.Instruction, 'id' | 'name' | 'description'>
    >
  >((options) => `/instructions${this.toQueryString(options)}`);

  public getInstruction = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Instruction
  >((id) => `/instructions/${id}`);

  public createInstruction = this.manufactureMethod<
    [
      {
        id: string;
        name: string;
        description: string;
        steps: string[];
        content: string;
        filename?: string;
      },
    ],
    Cumulonimbus.Data.Instruction
  >('/instructions', 'POST', WITH_BODY, (options) => {
    return JSON.stringify(options);
  });

  public editInstructionName = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.Instruction
  >(
    (id) => `/instructions/${id}/name`,
    'PUT',
    WITH_BODY,
    (_, name) => {
      return JSON.stringify({ name });
    },
  );

  public editInstructionDescription = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.Instruction
  >(
    (id) => `/instructions/${id}/description`,
    'PUT',
    WITH_BODY,
    (_, description) => {
      return JSON.stringify({ description });
    },
  );

  public editInstructionFile = this.manufactureMethod<
    [string, string, string | undefined],
    Cumulonimbus.Data.Instruction
  >(
    (id) => `/instructions/${id}/file`,
    'PUT',
    WITH_BODY,
    (_, content, filename) => {
      return JSON.stringify({ content, filename });
    },
  );

  public editInstructionSteps = this.manufactureMethod<
    [string, string[]],
    Cumulonimbus.Data.Instruction
  >(
    (id) => `/instructions/${id}/steps`,
    'PUT',
    WITH_BODY,
    (_, steps) => {
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

  // KillSwitch Methods

  public getKillSwitches = this.manufactureMethodGet<
    [],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >('/killswitches');

  public enableKillSwitch = this.manufactureMethod<
    [Cumulonimbus.KillSwitches],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >((id) => `/killswitches/${id}`, 'PUT');

  public disableKillSwitch = this.manufactureMethod<
    [Cumulonimbus.KillSwitches],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >((id) => `/killswitches/${id}`, 'DELETE');

  public disableAllKillSwitches = this.manufactureMethod<
    [],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >('/killswitches', 'DELETE');

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
      staff: boolean;
      domain: string;
      subdomain: string | null;
      verifiedAt: string | null;
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

    export interface KillSwitch {
      id: number;
      name: string;
      state: boolean;
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
    EMAIL_NOT_VERIFIED_ERROR: 'Email Not Verified';
    EMAIL_ALREADY_VERIFIED_ERROR: 'Email Already Verified';
    INVALID_VERIFICATION_TOKEN_ERROR: 'Invalid Verification Token';
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
    SEND_VERIFICATION_EMAIL_SUCCESS: 'Verification Email Successfully Sent';
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

  export enum KillSwitches {
    // Account related killSwitches
    ACCOUNT_CREATE,
    ACCOUNT_MODIFY,
    ACCOUNT_DELETE,
    ACCOUNT_EMAIL_VERIFY,
    ACCOUNT_LOGIN,
    // File related killSwitches
    FILE_CREATE,
    FILE_MODIFY,
    FILE_DELETE,
    // The Global KillSwitch
    GLOBAL,
  }
}

export default Cumulonimbus;
