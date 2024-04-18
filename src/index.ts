import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

// Hard-code the version number, because it's not worth the effort to automate it
const version = '5.0.0';

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
    options: Cumulonimbus.RequestInit = {},
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

    try {
      let json = await res.json();
      if (!res.ok) {
        // Check if the response is a 413, and if so, construct a new BODY_TOO_LARGE error, as we can't be sure the server returns a proper error (Thanks, Cloudflare!)
        if (res.status === 413) {
          throw new Cumulonimbus.ResponseError(
            {
              code: 'BODY_TOO_LARGE_ERROR',
              message: 'Body Too Large',
            },
            ratelimit,
          );
        } else {
          switch (json.code) {
            case 'MISSING_FIELDS_ERROR':
              throw new Cumulonimbus.MissingFieldsError(json, ratelimit);
            case 'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR':
              throw new Cumulonimbus.SecondFactorChallengeRequiredError(
                json,
                ratelimit,
              );
            default:
              throw new Cumulonimbus.ResponseError(json, ratelimit);
          }
        }
      } else return { result: json, ratelimit, response: res };
    } catch (error) {
      // If we error for whatever reason, just throw the error we catch.
      throw error;
    }
  }

  // Call an endpoint from the Cumulonimbus API, but with an Authorization header
  private async authenticatedCall<T>(
    url: string,
    options: Cumulonimbus.RequestInit = {},
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
    username: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    rememberMe: boolean = false,
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };
    const res = await fetch(
      (clientOptions && clientOptions.baseURL
        ? clientOptions.baseURL
        : Cumulonimbus.BASE_URL) + '/login',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username,
          rememberMe,
          'password':
            typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
          '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
        }),
      },
    );

    let ratelimit = Cumulonimbus.getRatelimitHeaders(res);

    const json = await res.json();

    if (!res.ok) {
      switch ((json as Cumulonimbus.Data.Error).code) {
        case 'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR':
          throw new Cumulonimbus.SecondFactorChallengeRequiredError(
            json,
            ratelimit,
          );
        case 'MISSING_FIELDS_ERROR':
          throw new Cumulonimbus.MissingFieldsError(json, ratelimit);
        default:
          throw new Cumulonimbus.ResponseError(json, ratelimit);
      }
    }

    return new Cumulonimbus(json.token, clientOptions);
  }

  public static async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    rememberMe: boolean = false,
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus> {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };
    const res = await fetch(
      (clientOptions && clientOptions.baseURL
        ? clientOptions.baseURL
        : Cumulonimbus.BASE_URL) + '/register',
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

    let ratelimit = Cumulonimbus.getRatelimitHeaders(res);

    const json = await res.json();

    if (!res.ok) {
      switch ((json as Cumulonimbus.Data.Error).code) {
        case 'MISSING_FIELDS_ERROR':
          throw new Cumulonimbus.MissingFieldsError(json, ratelimit);
        default:
          throw new Cumulonimbus.ResponseError(json, ratelimit);
      }
    }

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
  public createScopedSession = this.manufactureMethod<
    [string, number, string | Cumulonimbus.SecondFactorResponse, boolean],
    Cumulonimbus.Data.ScopedSessionCreate
  >(
    '/users/me/sessions',
    'POST',
    WITH_BODY,
    (name, permissionFlags, passwordOrSFR, longLived) =>
      JSON.stringify({
        name,
        permissionFlags,
        longLived,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public getSelfSession = this.manufactureMethodGet<
    [undefined | string],
    Cumulonimbus.Data.Session
  >((sid) => `/users/me/sessions/${sid || 'me'}`);

  public getUserSession = this.manufactureMethodGet<
    [string, string],
    Cumulonimbus.Data.Session
  >((uid, sid) => `/users/${uid}/sessions/${sid}`);

  public getSelfSessions = this.manufactureMethodGet<
    [{ limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.Session, 'id' | 'name'>>
  >((options) => `/users/me/sessions${this.toQueryString(options)}`);

  public getUserSessions = this.manufactureMethodGet<
    [string, { limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.Session, 'id' | 'name'>>
  >((uid, options) => `/users/${uid}/sessions${this.toQueryString(options)}`);

  public deleteSelfSession = this.manufactureMethod<
    [string | undefined],
    Cumulonimbus.Data.Success<'DELETE_SESSION_SUCCESS'>
  >((sid) => `/users/me/sessions/${sid || 'me'}`, 'DELETE');

  public deleteUserSession = this.manufactureMethod<
    [string, string],
    Cumulonimbus.Data.Success<'DELETE_SESSION_SUCCESS'>
  >((uid, sid) => `/users/${uid}/sessions/${sid}`, 'DELETE');

  public deleteSelfSessions = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
  >('/users/me/sessions', 'DELETE', WITH_BODY, (sessionIDs) =>
    JSON.stringify({ ids: sessionIDs }),
  );

  public deleteUserSessions = this.manufactureMethod<
    [string, string[]],
    Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
  >(
    (uid) => `/users/${uid}/sessions`,
    'DELETE',
    WITH_BODY,
    (_, sessionIDs) => JSON.stringify({ ids: sessionIDs }),
  );

  public deleteAllSelfSessions = this.manufactureMethod<
    [undefined | boolean],
    Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
  >(
    (includeSelf) =>
      `/users/me/sessions/all${this.toQueryString({
        includeSelf,
      })}`,
    'DELETE',
  );

  public deleteAllUserSessions = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
  >(
    (uid) => `/users/${uid}/sessions/all`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  // User Methods

  public getUsers = this.manufactureMethodGet<
    [{ limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.User, 'id' | 'username'>>
  >((options) => `/users${this.toQueryString(options)}`);

  public getSelf = this.manufactureMethodGet<[], Cumulonimbus.Data.User>(
    '/users/me',
  );

  public getUser = this.manufactureMethodGet<[string], Cumulonimbus.Data.User>(
    (user) => `/users/${user}`,
  );

  public editSelfUsername = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(`/users/me/username`, 'PUT', WITH_BODY, (username, passwordOrSFR) =>
    JSON.stringify({
      username,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public editUserUsername = this.manufactureMethod<
    [string, string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/username`,
    'PUT',
    WITH_BODY,
    (_, username, passwordOrSFR) =>
      JSON.stringify({
        username,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public editSelfEmail = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(`/users/me/email`, 'PUT', WITH_BODY, (email, passwordOrSFR) =>
    JSON.stringify({
      email,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public editUserEmail = this.manufactureMethod<
    [string, string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/email`,
    'PUT',
    WITH_BODY,
    (_, email, passwordOrSFR) =>
      JSON.stringify({
        email,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public async verifyEmail(
    token: string,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'VERIFY_EMAIL_SUCCESS'>>
  > {
    return await this.call<Cumulonimbus.Data.Success<'VERIFY_EMAIL_SUCCESS'>>(
      `/users/verify`,
      {
        method: 'PUT',
        headers: WITH_BODY,
        body: JSON.stringify({
          token,
        }),
      },
    );
  }

  public verifyUserEmail = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/verify`,
    'PUT',
    WITH_BODY,
    (_, tokenOrSFR) =>
      JSON.stringify({
        'password': typeof tokenOrSFR === 'string' ? tokenOrSFR : undefined,
        '2fa': typeof tokenOrSFR === 'string' ? undefined : tokenOrSFR,
      }),
  );

  public resendSelfVerificationEmail = this.manufactureMethodGet<
    [],
    Cumulonimbus.Data.Success
  >('/users/me/verify');

  public resendUserVerificationEmail = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.Success
  >((uid) => `/users/${uid}/verify`);

  public unverifyUserEmail = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/verify`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public editSelfPassword = this.manufactureMethod<
    [string, string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    '/users/me/password',
    'PUT',
    WITH_BODY,
    (newPassword, confirmNewPassword, passwordOrSFR) =>
      JSON.stringify({
        newPassword,
        confirmNewPassword,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public editUserPassword = this.manufactureMethod<
    [string, string, string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/password`,
    'PUT',
    WITH_BODY,
    (_, newPassword, confirmNewPassword, passwordOrSFR) =>
      JSON.stringify({
        newPassword,
        confirmNewPassword,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public grantStaff = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/staff`,
    'PUT',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public revokeStaff = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/staff`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public banUser = this.manufactureMethod<
    [string, string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/ban`,
    'PUT',
    WITH_BODY,
    (_, reason, passwordOrSFR) =>
      JSON.stringify({
        reason,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public unbanUser = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/ban`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public editSelfDomainSelection = this.manufactureMethod<
    [{ domain: string; subdomain?: string }],
    Cumulonimbus.Data.User
  >('/users/me/domain', 'PUT', WITH_BODY, JSON.stringify);

  public editUserDomainSelection = this.manufactureMethod<
    [string, { domain: string; subdomain?: string }],
    Cumulonimbus.Data.User
  >(
    (uid) => `/users/${uid}/domain`,
    'PUT',
    WITH_BODY,
    (_, options) => {
      return JSON.stringify(options);
    },
  );

  public deleteSelf = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_USER_SUCCESS'>
  >('/users/me', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public deleteUser = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success
  >(
    (uid) => `/users/${uid}`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public deleteUsers = this.manufactureMethod<
    [string[], string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success
  >('/users', 'DELETE', WITH_BODY, (userIDs, passwordOrSFR) =>
    JSON.stringify({
      'ids': userIDs,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

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
    Cumulonimbus.Data.Success<'DELETE_FILE_SUCCESS'>
  >((id) => `/files/${id}`, 'DELETE');

  public deleteFiles = this.manufactureMethod<
    [string[]],
    Cumulonimbus.Data.Success<'DELETE_FILES_SUCCESS'>
  >('/files', 'DELETE', WITH_BODY, (ids) => {
    return JSON.stringify({ ids });
  });

  public deleteAllSelfFiles = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_FILES_SUCCESS'>
  >('/files/all?user=me', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public deleteAllUserFiles = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_FILES_SUCCESS'>
  >(
    (uid) => `/files/all?user=${uid}`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
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
    [Cumulonimbus.KillSwitches, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >(
    (id) => `/killswitches/${id}`,
    'PUT',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public disableKillSwitch = this.manufactureMethod<
    [Cumulonimbus.KillSwitches, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >(
    (id) => `/killswitches/${id}`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public disableAllKillSwitches = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
  >('/killswitches', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  // Second Factor Methods

  public beginTOTPRegistration = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.SecondFactorTOTPRegistration
  >('/users/me/2fa/totp', 'POST', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public confirmTOTPRegistration = this.manufactureMethod<
    [string, string, string],
    Cumulonimbus.Data.SecondFactorRegisterSuccess
  >('/users/me/2fa/totp/confirm', 'POST', WITH_BODY, (token, name, code) =>
    JSON.stringify({ token, code, name }),
  );

  public beginWebAuthnRegistration = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.SecondFactorWebAuthnRegistration
  >('/users/me/2fa/webauthn/', 'POST', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public confirmWebAuthnRegistration = this.manufactureMethod<
    [string, string, RegistrationResponseJSON],
    Cumulonimbus.Data.SecondFactorRegisterSuccess
  >(
    '/users/me/2fa/webauthn/confirm',
    'POST',
    WITH_BODY,
    (token, name, response) => JSON.stringify({ token, response, name }),
  );

  public regenerateBackupCodes = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.SecondFactorBackupRegisterSuccess
  >('/users/me/2fa/backup', 'POST', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public getSelfSecondFactors = this.manufactureMethodGet<
    [{ limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<
      Extract<Cumulonimbus.Data.SecondFactor, 'id' | 'name'>
    >
  >((options) => `/users/me/2fa${this.toQueryString(options)}`);

  public getUserSecondFactors = this.manufactureMethodGet<
    [string, { limit?: number; offset?: number } | undefined],
    Cumulonimbus.Data.List<
      Extract<Cumulonimbus.Data.SecondFactor, 'id' | 'name'>
    >
  >((uid, options) => `/users/${uid}/2fa${this.toQueryString(options)}`);

  public getSelfSecondFactor = this.manufactureMethodGet<
    [string],
    Cumulonimbus.Data.SecondFactor
  >((id) => `/users/me/2fa/${id}`);

  public getUserSecondFactor = this.manufactureMethodGet<
    [string, string],
    Cumulonimbus.Data.SecondFactor
  >((uid, id) => `/users/${uid}/2fa/${id}`);

  public deleteSelfSecondFactor = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SECOND_FACTOR_SUCCESS'>
  >(
    (id) => `/users/me/2fa/${id}`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public deleteUserSecondFactor = this.manufactureMethod<
    [string, string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SECOND_FACTOR_SUCCESS'>
  >(
    (uid, id) => `/users/${uid}/2fa/${id}`,
    'DELETE',
    WITH_BODY,
    (_, __, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public deleteSelfSecondFactors = this.manufactureMethod<
    [string[], string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
  >('/users/me/2fa', 'DELETE', WITH_BODY, (ids, passwordOrSFR) =>
    JSON.stringify({
      ids,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public deleteUserSecondFactors = this.manufactureMethod<
    [string, string[], string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
  >(
    (uid) => `/users/${uid}/2fa`,
    'DELETE',
    WITH_BODY,
    (_, ids, passwordOrSFR) =>
      JSON.stringify({
        ids,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  public deleteAllSelfSecondFactors = this.manufactureMethod<
    [string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
  >('/users/me/2fa/all', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  public deleteAllUserSecondFactors = this.manufactureMethod<
    [string, string | Cumulonimbus.SecondFactorResponse],
    Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
  >(
    (uid) => `/users/${uid}/2fa/all`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

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

  export interface RequestInit extends globalThis.RequestInit {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  export interface APIResponse<T> {
    result: T;
    ratelimit: RatelimitData | null;
    response: Response;
  }

  export type SecondFactorResponse = {
    token: string;
  } & (
    | {
        type: 'totp';
        code: string;
      }
    | {
        type: 'backup';
        code: string;
      }
    | {
        type: 'webauthn';
        response: AuthenticationResponseJSON;
      }
  );

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
      twoFactorBackupCodeUsedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }

    export interface Session {
      id: number;
      exp: number;
      name: string;
      permissionFlags: number;
      usedAt: string;
      createdAt: string;
      updatedAt: string;
    }

    export interface List<T> {
      count: number;
      items: T[];
    }

    export type Success<T extends keyof Successes = keyof Successes> = {
      [K in keyof Successes[T]]: Successes[T][K];
    };

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

    export type Error<T extends keyof Errors = keyof Errors> = {
      [K in keyof Errors[T]]: Errors[T][K];
    };

    export interface SuccessfulAuth {
      token: string;
      exp: number;
    }

    export interface SecondFactor {
      id: string;
      name: string;
      type: ('totp' | 'webauthn')[];
      usedAt: string | null;
      createdAt: string;
      updatedAt: string;
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

    export interface SecondFactorBaseRegistration {
      token: string;
      exp: number;
      type: 'totp' | 'webauthn';
    }

    export interface SecondFactorTOTPRegistration
      extends SecondFactorBaseRegistration {
      type: 'totp';
      secret: string;
      algorithm: string;
      digits: number;
      period: number;
    }
    export interface SecondFactorWebAuthnRegistration
      extends SecondFactorBaseRegistration,
        PublicKeyCredentialCreationOptionsJSON {
      type: 'webauthn';
    }

    export interface SecondFactorRegisterSuccess {
      id: string;
      name: string;
      type: 'totp' | 'webauthn';
      codes?: string[];
    }

    export interface SecondFactorBackupRegisterSuccess {
      codes: string[];
    }

    export interface ScopedSessionCreate extends Session {
      token: string;
    }
  }

  export interface Errors {
    INVALID_ENDPOINT_ERROR: {
      code: 'INVALID_ENDPOINT_ERROR';
      message: 'Invalid Endpoint';
    };
    INSUFFICIENT_PERMISSIONS_ERROR: {
      code: 'INSUFFICIENT_PERMISSIONS_ERROR';
      message: 'Insufficient Permissions';
    };
    ENDPOINT_REQUIRES_SECOND_FACTOR_ERROR: {
      code: 'ENDPOINT_REQUIRES_SECOND_FACTOR_ERROR';
      message: 'Endpoint Requires Second Factor';
    };
    INVALID_USER_ERROR: {
      code: 'INVALID_USER_ERROR';
      message: 'Invalid User';
    };
    USER_REQUIRES_SECOND_FACTOR_ERROR: {
      code: 'USER_REQUIRES_SECOND_FACTOR_ERROR';
      message: 'User Requires Second Factor';
    };
    INVALID_USERNAME_ERROR: {
      code: 'INVALID_USERNAME_ERROR';
      message: 'Invalid Username';
    };
    INVALID_SECOND_FACTOR_ERROR: {
      code: 'INVALID_SECOND_FACTOR_ERROR';
      message: 'Invalid Second Factor';
    };
    INVALID_SECOND_FACTOR_METHOD_ERROR: {
      code: 'INVALID_SECOND_FACTOR_METHOD_ERROR';
      message: 'Invalid Second Factor Method';
    };
    INVALID_SECOND_FACTOR_RESPONSE_ERROR: {
      code: 'INVALID_SECOND_FACTOR_RESPONSE_ERROR';
      message: 'Invalid Second Factor Response';
    };
    SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR: {
      code: 'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR';
      message: 'Second Factor Challenge Required';
      token: string;
      types: ('totp' | 'backup' | 'webauthn')[];
      challenge?: PublicKeyCredentialRequestOptionsJSON;
    };
    INVALID_PASSWORD_ERROR: {
      code: 'INVALID_PASSWORD_ERROR';
      message: 'Invalid Password';
    };
    PASSWORDS_DO_NOT_MATCH_ERROR: {
      code: 'PASSWORDS_DO_NOT_MATCH_ERROR';
      message: 'Passwords Do Not Match';
    };
    INVALID_EMAIL_ERROR: {
      code: 'INVALID_EMAIL_ERROR';
      message: 'Invalid Email';
    };
    EMAIL_NOT_VERIFIED_ERROR: {
      code: 'EMAIL_NOT_VERIFIED_ERROR';
      message: 'Email Not Verified';
    };
    EMAIL_ALREADY_VERIFIED_ERROR: {
      code: 'EMAIL_ALREADY_VERIFIED_ERROR';
      message: 'Email Already Verified';
    };
    INVALID_VERIFICATION_TOKEN_ERROR: {
      code: 'INVALID_VERIFICATION_TOKEN_ERROR';
      message: 'Invalid Verification Token';
    };
    INVALID_SESSION_ERROR: {
      code: 'INVALID_SESSION_ERROR';
      message: 'Invalid Session';
    };
    INVALID_DOMAIN_ERROR: {
      code: 'INVALID_DOMAIN_ERROR';
      message: 'Invalid Domain';
    };
    SUBDOMAIN_TOO_LONG_ERROR: {
      code: 'SUBDOMAIN_TOO_LONG_ERROR';
      message: 'Subdomain Too Long';
    };
    INVALID_FILE_ERROR: {
      code: 'INVALID_FILE_ERROR';
      message: 'Invalid File';
    };
    INVALID_INSTRUCTION_ERROR: {
      code: 'INVALID_INSTRUCTION_ERROR';
      message: 'Invalid Instruction';
    };
    SUBDOMAIN_NOT_ALLOWED_ERROR: {
      code: 'SUBDOMAIN_NOT_ALLOWED_ERROR';
      message: 'Subdomain Not Allowed';
    };
    DOMAIN_EXISTS_ERROR: {
      code: 'DOMAIN_EXISTS_ERROR';
      message: 'Domain Exists';
    };
    USER_EXISTS_ERROR: {
      code: 'USER_EXISTS_ERROR';
      message: 'User Exists';
    };
    INSTRUCTION_EXISTS_ERROR: {
      code: 'INSTRUCTION_EXISTS_ERROR';
      message: 'Instruction Exists';
    };
    MISSING_FIELDS_ERROR: {
      code: 'MISSING_FIELDS_ERROR';
      message: 'Missing Fields';
      fields: string[];
    };
    BANNED_ERROR: {
      code: 'BANNED_ERROR';
      message: 'Banned';
    };
    BODY_TOO_LARGE_ERROR: {
      code: 'BODY_TOO_LARGE_ERROR';
      message: 'Body Too Large';
    };
    SERVICE_UNAVAILABLE_ERROR: {
      code: 'SERVICE_UNAVAILABLE_ERROR';
      message: 'Service Unavailable';
      feature: number;
    };
    RATELIMITED_ERROR: {
      code: 'RATELIMITED_ERROR';
      message: 'You Have Been Ratelimited. Please Try Again Later.';
    };
    INTERNAL_ERROR: {
      code: 'INTERNAL_ERROR';
      message: 'Internal Server Error';
    };
    NOT_IMPLEMENTED_ERROR: {
      code: 'NOT_IMPLEMENTED_ERROR';
      message: 'Not Implemented';
    };
  }

  export interface Successes {
    DELETE_USER_SUCCESS: {
      code: 'DELETE_USER_SUCCESS';
      message: 'User Successfully Deleted';
    };
    DELETE_USERS_SUCCESS: {
      code: 'DELETE_USERS_SUCCESS';
      message: 'Users Successfully Deleted';
      count: number;
    };
    DELETE_FILE_SUCCESS: {
      code: 'DELETE_FILE_SUCCESS';
      message: 'File Successfully Deleted';
    };
    DELETE_FILES_SUCCESS: {
      code: 'DELETE_FILES_SUCCESS';
      message: 'Files Successfully Deleted';
      count: number;
    };
    DELETE_SESSION_SUCCESS: {
      code: 'DELETE_SESSION_SUCCESS';
      message: 'Session Successfully Deleted';
    };
    DELETE_SESSIONS_SUCCESS: {
      code: 'DELETE_SESSIONS_SUCCESS';
      message: 'Sessions Successfully Deleted';
      count: number;
    };
    DELETE_DOMAIN_SUCCESS: {
      code: 'DELETE_DOMAIN_SUCCESS';
      message: 'Domain Successfully Deleted';
    };
    DELETE_DOMAINS_SUCCESS: {
      code: 'DELETE_DOMAINS_SUCCESS';
      message: 'Domains Successfully Deleted';
      count: number;
    };
    DELETE_INSTRUCTION_SUCCESS: {
      code: 'DELETE_INSTRUCTION_SUCCESS';
      message: 'Instruction Successfully Deleted';
    };
    DELETE_INSTRUCTIONS_SUCCESS: {
      code: 'DELETE_INSTRUCTIONS_SUCCESS';
      message: 'Instructions Successfully Deleted';
      count: number;
    };
    SEND_VERIFICATION_EMAIL_SUCCESS: {
      code: 'SEND_VERIFICATION_EMAIL_SUCCESS';
      message: 'Verification Email Successfully Sent';
    };
    VERIFY_EMAIL_SUCCESS: {
      code: 'VERIFY_EMAIL_SUCCESS';
      message: 'Successfully Verified Email';
    };
    DELETE_SECOND_FACTOR_SUCCESS: {
      code: 'DELETE_SECOND_FACTOR_SUCCESS';
      message: 'Second Factor Successfully Deleted';
    };
    DELETE_SECOND_FACTORS_SUCCESS: {
      code: 'DELETE_SECOND_FACTORS_SUCCESS';
      message: 'Second Factors Successfully Deleted';
      count: number;
    };
  }

  export class ResponseError<
    T extends keyof Errors = keyof Errors,
  > extends Error {
    code: T;
    message: Errors[T]['message'];
    ratelimit: RatelimitData | null;
    constructor(response: Data.Error, ratelimit: RatelimitData | null = null) {
      super(response.message as string);
      Object.setPrototypeOf(this, ResponseError.prototype);
      this.code = response.code as T;
      this.message = response.message;
      this.ratelimit = ratelimit;
      Object.assign(this, response);
    }
  }

  export class MissingFieldsError extends ResponseError<'MISSING_FIELDS_ERROR'> {
    constructor(
      response: Errors['MISSING_FIELDS_ERROR'],
      ratelimit: RatelimitData | null = null,
    ) {
      super(response, ratelimit);
      Object.setPrototypeOf(this, MissingFieldsError.prototype);
    }
  }

  export class SecondFactorChallengeRequiredError extends ResponseError<'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR'> {
    constructor(
      response: Errors['SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR'],
      ratelimit: RatelimitData | null = null,
    ) {
      super(response, ratelimit);
      Object.setPrototypeOf(this, SecondFactorChallengeRequiredError.prototype);
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

  export enum PermissionFlags {
    ALL = 1 << 0,
    UPLOAD_FILE = 1 << 1,
    ACCOUNT_READ = 1 << 2,
    ACCOUNT_MODIFY = 1 << 3,
    SECOND_FACTOR_READ = 1 << 4,
    SESSION_READ = 1 << 5,
    SESSION_MODIFY = 1 << 6,
    FILE_READ = 1 << 7,
    FILE_MODIFY = 1 << 8,
    STAFF_READ_ACCOUNTS = 1 << 9,
    STAFF_MODIFY_ACCOUNTS = 1 << 10,
    STAFF_READ_SECOND_FACTORS = 1 << 11,
    STAFF_MODIFY_SECOND_FACTORS = 1 << 12,
    STAFF_READ_SESSIONS = 1 << 13,
    STAFF_MODIFY_SESSIONS = 1 << 14,
    STAFF_READ_FILES = 1 << 15,
    STAFF_MODIFY_FILES = 1 << 16,
    STAFF_MODIFY_DOMAINS = 1 << 17,
    STAFF_MODIFY_INSTRUCTIONS = 1 << 18,
    STAFF_MODIFY_KILLSWITCHES = 1 << 19,
  }

  export enum PermissionGroups {
    ACCOUNT = PermissionFlags.ACCOUNT_READ | PermissionFlags.ACCOUNT_MODIFY,
    SESSION = PermissionFlags.SESSION_READ | PermissionFlags.SESSION_MODIFY,
    FILE = PermissionFlags.FILE_READ | PermissionFlags.FILE_MODIFY,
    STAFF = PermissionFlags.STAFF_READ_ACCOUNTS |
      PermissionFlags.STAFF_MODIFY_ACCOUNTS |
      PermissionFlags.STAFF_READ_SECOND_FACTORS |
      PermissionFlags.STAFF_MODIFY_SECOND_FACTORS |
      PermissionFlags.STAFF_READ_SESSIONS |
      PermissionFlags.STAFF_MODIFY_SESSIONS |
      PermissionFlags.STAFF_READ_FILES |
      PermissionFlags.STAFF_MODIFY_FILES |
      PermissionFlags.STAFF_MODIFY_DOMAINS |
      PermissionFlags.STAFF_MODIFY_INSTRUCTIONS |
      PermissionFlags.STAFF_MODIFY_KILLSWITCHES,
    STAFF_ACCOUNTS = PermissionFlags.STAFF_READ_ACCOUNTS |
      PermissionFlags.STAFF_MODIFY_ACCOUNTS,
    STAFF_SECOND_FACTORS = PermissionFlags.STAFF_READ_SECOND_FACTORS |
      PermissionFlags.STAFF_MODIFY_SECOND_FACTORS,
    STAFF_SESSIONS = PermissionFlags.STAFF_READ_SESSIONS |
      PermissionFlags.STAFF_MODIFY_SESSIONS,
    STAFF_FILES = PermissionFlags.STAFF_READ_FILES |
      PermissionFlags.STAFF_MODIFY_FILES,
    STAFF_ONLY = PermissionFlags.STAFF_MODIFY_DOMAINS |
      PermissionFlags.STAFF_MODIFY_INSTRUCTIONS |
      PermissionFlags.STAFF_MODIFY_KILLSWITCHES,
  }
}

export default Cumulonimbus;
