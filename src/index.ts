import Structures from 'cumulonimbus-types';
import type {
  RegistrationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import {
  Errors as _Errors,
  Enums,
  Successes as _Successes,
} from 'cumulonimbus-types';

// Hard-code the version number, because it's not worth the effort to automate it
const version =
  'hiiamversionsentinelpleasereplacemewiththeversionatbuildtimethanks';

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
/**
 * The Cumulonimbus API wrapper.
 */
class Cumulonimbus {
  private token: string;
  private userAgent: string = USER_AGENT;

  constructor(
    token: string,
    private options: Cumulonimbus.ClientOptions = {},
  ) {
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
      let json: any = await res.json();
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
  private toQueryString(
    params?: Record<string, string | number | boolean | undefined> | null,
  ): string {
    if (!params) return '';
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
              `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`,
          )
          .join('&')
      );
  }

  /**
   * Login to an existing account with the Cumulonimbus API.
   * @returns A promise that resolves to a Cumulonimbus instance.
   */
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

    const json: any = await res.json();

    if (!res.ok) {
      switch ((json as Structures.Error).code) {
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

  /**
   * Register an account with the Cumulonimbus API.
   * @returns A promise that resolves to a Cumulonimbus instance.
   */
  public static async register(
    username: string,
    email: string,
    password: string,
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
          rememberMe,
        }),
      },
    );

    let ratelimit = Cumulonimbus.getRatelimitHeaders(res);

    const json: any = await res.json();

    if (!res.ok) {
      switch ((json as Structures.Error).code) {
        case 'MISSING_FIELDS_ERROR':
          throw new Cumulonimbus.MissingFieldsError(json, ratelimit);
        default:
          throw new Cumulonimbus.ResponseError(json, ratelimit);
      }
    }

    return new Cumulonimbus(json.token, clientOptions);
  }

  // API Status Methods

  /**
   * Get the API status of the Cumulonimbus API.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public static async getAPIStatus(
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Structures.APIStatus> {
    const res = await fetch(
      clientOptions && clientOptions.baseURL
        ? clientOptions.baseURL
        : Cumulonimbus.BASE_URL + '/',
    );
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal Server Error',
      });
    else return (await res.json()) as any;
  }

  /**
   * Get the API status of the Cumulonimbus thumbnail API.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public static async getThumbnailAPIStatus(
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Structures.APIStatus> {
    const res = await fetch(
      clientOptions && clientOptions.baseThumbnailURL
        ? clientOptions.baseThumbnailURL
        : Cumulonimbus.BASE_THUMBNAIL_URL + '/',
    );
    if (!res.ok)
      throw new Cumulonimbus.ResponseError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal Server Error',
      });
    else return (await res.json()) as any;
  }

  //-- Instance Methods --//

  /**
   * Get a thumbnail of a file from the Cumulonimbus thumbnail API.
   * @returns A promise that resolves to an ArrayBuffer of the thumbnail.
   */
  public async getThumbnail(
    id: string | Structures.File,
  ): Promise<ArrayBuffer> {
    const fileID = typeof id === 'string' ? id : id.id;
    const res = await fetch(`${this.options.baseThumbnailURL}/${fileID}`);
    if (!res.ok) throw new Cumulonimbus.ThumbnailError(res);
    else return await res.arrayBuffer();
  }

  /**
   * Get the API status of the Cumulonimbus API. This method is an alias of the static method and is automatically populated with the client's options.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public async getAPIStatus(): Promise<Structures.APIStatus> {
    return await Cumulonimbus.getAPIStatus(this.options);
  }

  /**
   * Get the API status of the Cumulonimbus thumbnail API. This method is an alias of the static method and is automatically populated with the client's options.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public async getThumbnailAPIStatus(): Promise<Structures.APIStatus> {
    return await Cumulonimbus.getThumbnailAPIStatus(this.options);
  }

  /**
   * Creates a scoped session.
   * @returns A promise that resolves to an API response containing the created session.
   * @link https://docs.alekeagle.me/api/session#post-users-me-sessions
   */
  public createScopedSession = this.manufactureMethod<
    [
      name: string,
      permissionFlags: number,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
      longLived?: boolean,
    ],
    Structures.ScopedSessionCreate
  >(
    '/users/me/sessions',
    'POST',
    WITH_BODY,
    (name, permissionFlags, passwordOrSFR, longLived?) =>
      JSON.stringify({
        name,
        permissionFlags,
        longLived,
        // todo: this allows passed arguments to get to the api, do we want that?
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  /**
   * Get information about one of your own sessions.
   * @returns A promise that resolves to an API response containing the session.
   * @link https://docs.alekeagle.me/api/session#get-users-me-sessions-sid
   */
  public getSelfSession = this.manufactureMethodGet<
    [sid?: null | string],
    Structures.Session
  >((sid) => `/users/me/sessions/${sid ?? 'me'}`);

  /**
   * Update one of your own sessions.
   * @returns A promise that resolves to an API response containing the updated session.
   * @link https://docs.alekeagle.me/api/session#patch-users-me-sessions-sid
   */
  public updateSelfSession = this.manufactureMethod<
    [sid: undefined | null | string, name: string],
    Structures.Session
  >(
    (sid) => `/users/me/sessions/${sid ?? 'me'}`,
    'PATCH',
    WITH_BODY,
    (_, name) => JSON.stringify({ name }),
  );

  /**
   * Get information about one of a user's sessions.
   * @returns A promise that resolves to an API response containing the session.
   * @link https://docs.alekeagle.me/api/session#get-users-uid-sessions-sid
   */
  public getUserSession = this.manufactureMethodGet<
    [uid: string, sid: string],
    Structures.Session
  >((uid, sid) => `/users/${uid}/sessions/${sid}`);

  /**
   * Update one of a user's sessions.
   * @returns A promise that resolves to an API response containing the updated session.
   * @link https://docs.alekeagle.me/api/session#patch-users-uid-sessions-sid
   */
  public updateUserSession = this.manufactureMethod<
    [uid: string, sid: string, name: string],
    Structures.Session
  >(
    (uid, sid) => `/users/${uid}/sessions/${sid}`,
    'PATCH',
    WITH_BODY,
    (_, __, name) => JSON.stringify({ name }),
  );

  /**
   * Get a list of your own sessions.
   * @returns A promise that resolves to an API response containing the sessions.
   * @link https://docs.alekeagle.me/api/session#get-users-me-sessions
   */
  public getSelfSessions = this.manufactureMethodGet<
    [options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.Session, 'id' | 'name'>>
  >((options) => `/users/me/sessions${this.toQueryString(options)}`);

  /**
   * Get a list of a user's sessions.
   * @returns A promise that resolves to an API response containing the sessions.
   * @link https://docs.alekeagle.me/api/session#get-users-uid-sessions
   */
  public getUserSessions = this.manufactureMethodGet<
    [uid: string, options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.Session, 'id' | 'name'>>
  >((uid, options) => `/users/${uid}/sessions${this.toQueryString(options)}`);

  /**
   * Delete one of your own sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-me-sessions-sid
   */
  public deleteSelfSession = this.manufactureMethod<
    [sid?: null | string],
    Structures.Success<'DELETE_SESSION_SUCCESS'>
  >((sid) => `/users/me/sessions/${sid ?? 'me'}`, 'DELETE');

  /**
   * Delete one of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions-sid
   */
  public deleteUserSession = this.manufactureMethod<
    [uid: string, sid: string],
    Structures.Success<'DELETE_SESSION_SUCCESS'>
  >((uid, sid) => `/users/${uid}/sessions/${sid}`, 'DELETE');

  /**
   * Delete a list of your own sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-me-sessions
   */
  public deleteSelfSessions = this.manufactureMethod<
    [sessionIDs: string[]],
    Structures.Success<'DELETE_SESSIONS_SUCCESS'>
  >('/users/me/sessions', 'DELETE', WITH_BODY, (sessionIDs) =>
    JSON.stringify({ ids: sessionIDs }),
  );

  /**
   * Delete a list of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions
   */
  public deleteUserSessions = this.manufactureMethod<
    [uid: string, sessionIDs: string[]],
    Structures.Success<'DELETE_SESSIONS_SUCCESS'>
  >(
    (uid) => `/users/${uid}/sessions`,
    'DELETE',
    WITH_BODY,
    (_, sessionIDs) => JSON.stringify({ ids: sessionIDs }),
  );

  /**
   * Delete all of your own sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-me-sessions-all
   */
  public deleteAllSelfSessions = this.manufactureMethod<
    [includeSelf?: undefined | boolean],
    Structures.Success<'DELETE_SESSIONS_SUCCESS'>
  >(
    (includeSelf) =>
      `/users/me/sessions/all${this.toQueryString({
        includeSelf,
      })}`,
    'DELETE',
  );

  /**
   * Delete all of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions-all
   */
  public deleteAllUserSessions = this.manufactureMethod<
    [uid: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_SESSIONS_SUCCESS'>
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

  /**
   * Get a list of all users.
   * @returns A promise that resolves to an API response containing the users.
   * @link https://docs.alekeagle.me/api/account#get-users
   */
  public getUsers = this.manufactureMethodGet<
    [options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.User, 'id' | 'username'>>
  >((options) => `/users${this.toQueryString(options)}`);

  /**
   * Get information about your own user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#get-users-me
   */
  public getSelf = this.manufactureMethodGet<[], Structures.User>('/users/me');

  /**
   * Get information about a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#get-users-id
   */
  public getUser = this.manufactureMethodGet<[id: string], Structures.User>(
    (user) => `/users/${user}`,
  );

  /**
   * Edit your own username.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-username
   */
  public editSelfUsername = this.manufactureMethod<
    [
      username: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.User
  >(`/users/me/username`, 'PUT', WITH_BODY, (username, passwordOrSFR) =>
    JSON.stringify({
      username,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Edit a user's username.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-username
   */
  public editUserUsername = this.manufactureMethod<
    [
      id: string,
      username: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.User
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

  /**
   * Edit your own email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-email
   */
  public editSelfEmail = this.manufactureMethod<
    [email: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.User
  >(`/users/me/email`, 'PUT', WITH_BODY, (email, passwordOrSFR) =>
    JSON.stringify({
      email,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Edit a user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-email
   */
  public editUserEmail = this.manufactureMethod<
    [
      id: string,
      email: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.User
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

  /**
   * Verify your own email with the verification token.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#put-users-verify
   */
  public async verifyEmail(
    token: string,
  ): Promise<
    Cumulonimbus.APIResponse<Structures.Success<'VERIFY_EMAIL_SUCCESS'>>
  > {
    return this.call<Structures.Success<'VERIFY_EMAIL_SUCCESS'>>(
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

  /**
   * Verify another user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-verify
   */
  public verifyUserEmail = this.manufactureMethod<
    [id: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.User
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

  /**
   * Resend a verification email for your own email.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#get-users-me-verify
   */
  public resendSelfVerificationEmail = this.manufactureMethodGet<
    [],
    Structures.Success<'SEND_VERIFICATION_EMAIL_SUCCESS'>
  >('/users/me/verify');

  /**
   * Resend a verification email for another user's email.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#get-users-id-verify
   */
  public resendUserVerificationEmail = this.manufactureMethodGet<
    [id: string],
    Structures.Success<'SEND_VERIFICATION_EMAIL_SUCCESS'>
  >((uid) => `/users/${uid}/verify`);

  /**
   * Unverify another user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-verify
   */
  public unverifyUserEmail = this.manufactureMethod<
    [id: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.User
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

  /**
   * Edit your own password.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-password
   */
  public editSelfPassword = this.manufactureMethod<
    [
      newPassword: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.User
  >('/users/me/password', 'PUT', WITH_BODY, (newPassword, passwordOrSFR) =>
    JSON.stringify({
      newPassword,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Edit a user's password.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-password
   */
  public editUserPassword = this.manufactureMethod<
    [
      id: string,
      newPassword: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.User
  >(
    (uid) => `/users/${uid}/password`,
    'PUT',
    WITH_BODY,
    (_, newPassword, passwordOrSFR) =>
      JSON.stringify({
        newPassword,
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  /**
   * Grants a user staff permissions.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-staff
   */
  public grantStaff = this.manufactureMethod<
    [user: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.User
  >(
    (uid) => `/users/${uid}/staff`,
    'PUT',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        // todo: more leakage of params directly to api
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  /**
   * Revokes a user's staff permissions.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-staff
   */
  public revokeStaff = this.manufactureMethod<
    [user: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.User
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

  /**
   * Ban a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-ban
   */
  public banUser = this.manufactureMethod<
    [
      user: string,
      reason: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.User
  >(
    (uid) => `/users/${uid}/ban`,
    'PUT',
    WITH_BODY,
    (_, reason, passwordOrSFR) =>
      JSON.stringify({
        reason,
        // todo: more leakage of params directly to api
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  /**
   * Unban a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-ban
   */
  public unbanUser = this.manufactureMethod<
    [user: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.User
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

  /**
   * Selects a domain and subdomain for yourself.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-domain
   */
  public editSelfDomainSelection = this.manufactureMethod<
    [options: { domain: string; subdomain?: string }],
    Structures.User
  >('/users/me/domain', 'PUT', WITH_BODY, JSON.stringify);

  /**
   * Select a domain and subdomain for a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-domain
   */
  public editUserDomainSelection = this.manufactureMethod<
    [id: string, options: { domain: string; subdomain?: string }],
    Structures.User
  >(
    (uid) => `/users/${uid}/domain`,
    'PUT',
    WITH_BODY,
    (_, options) => JSON.stringify(options),
  );

  /**
   * Delete your own user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users-me
   */
  public deleteSelf = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_USER_SUCCESS'>
  >('/users/me', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Delete a user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users-id
   */
  public deleteUser = this.manufactureMethod<
    [id: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_USER_SUCCESS'>
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

  /**
   * Delete a list of specified users.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users
   */
  public deleteUsers = this.manufactureMethod<
    [
      userIDs: string[],
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.Success<'DELETE_USERS_SUCCESS'>
  >('/users', 'DELETE', WITH_BODY, (userIDs, passwordOrSFR) =>
    JSON.stringify({
      'ids': userIDs,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  // Domain Methods

  /**
   * Fetches a list of domains.
   * @returns A promise that resolves to an API response containing the domains.
   * @link https://docs.alekeagle.me/api/domain#get-domains
   */
  public getDomains = this.manufactureMethodGet<
    [
      options?: {
        limit?: number | 'all';
        offset?: number;
      },
    ],
    Structures.List<Pick<Structures.Domain, 'id' | 'subdomains'>>
  >((options) => {
    const { limit, offset } = options ?? {};
    return `/domains${this.toQueryString({
      limit: limit === 'all' ? -1 : limit,
      offset: limit === 'all' ? undefined : offset,
    })}`;
  });

  /**
   * Fetches a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#get-domains-id
   */
  public getDomain = this.manufactureMethodGet<[id: string], Structures.Domain>(
    (id) => `/domains/${id}`,
  );

  /**
   * Creates a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#post-domains
   */
  public createDomain = this.manufactureMethod<
    [id: string, subdomains?: boolean | undefined],
    Structures.Domain
  >('/domains', 'POST', WITH_BODY, (id, subdomains) =>
    JSON.stringify({ id, subdomains }),
  );

  /**
   * Allows subdomains for a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#put-domains-id-subdomains
   */
  public allowSubdomains = this.manufactureMethod<
    [id: string],
    Structures.Domain
  >((id) => `/domains/${id}/subdomains`, 'PUT');

  /**
   * Disallows subdomains for a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#delete-domains-id-subdomains
   */
  public disallowSubdomains = this.manufactureMethod<
    [id: string],
    Structures.Domain
  >((id) => `/domains/${id}/subdomains`, 'DELETE');

  /**
   * Deletes a domain.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/domain#delete-domains-id
   */
  public deleteDomain = this.manufactureMethod<
    [id: string],
    Structures.Success<'DELETE_DOMAIN_SUCCESS'>
  >((id) => `/domains/${id}`, 'DELETE');

  /**
   * Deletes a list of domains.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/domain#delete-domains
   */
  public deleteDomains = this.manufactureMethod<
    [domainIDs: string[]],
    Structures.Success<'DELETE_DOMAINS_SUCCESS'>
  >('/domains', 'DELETE', WITH_BODY, (ids) => JSON.stringify({ ids }));

  // File Methods

  /**
   * Gets a list of all files.
   * @returns A promise that resolves to an API response containing the files.
   * @link https://docs.alekeagle.me/api/file#get-files
   */
  public getAllFiles = this.manufactureMethodGet<
    [options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.File, 'id' | 'name'>>
  >((options) => `/files${this.toQueryString(options)}`);

  /**
   * Gets a list of all files belonging to you.
   * @returns A promise that resolves to an API response containing the files.
   * @link https://docs.alekeagle.me/api/file#get-users-me-files
   */
  public getSelfFiles = this.manufactureMethodGet<
    [options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.File, 'id' | 'name'>>
  >((options) => `/users/me/files${this.toQueryString(options)}`);

  /**
   * Gets a list of all files belonging to a user.
   * @returns  A promise that resolves to an API response containing the files.
   * @link https://docs.alekeagle.me/api/file#get-users-uid-files
   */
  public getUserFiles = this.manufactureMethodGet<
    [uid: string, options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.File, 'id' | 'name'>>
  >((uid, options) => `/users/${uid}/files${this.toQueryString(options)}`);

  /**
   * Fetches an arbitrary file using only its ID.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#get-files-id
   */
  public getArbitraryFile = this.manufactureMethodGet<
    [id: string],
    Structures.File
  >((id) => `/files/${id}`);

  /**
   * Fetches a file belonging to you using its ID.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#get-users-me-files-id
   */
  public getSelfFile = this.manufactureMethodGet<[id: string], Structures.File>(
    (id) => `/users/me/files/${id}`,
  );

  /**
   * Fetches a file belonging to a user using its ID.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#get-users-uid-files-id
   */
  public getUserFile = this.manufactureMethodGet<
    [uid: string, id: string],
    Structures.File
  >((uid, id) => `/users/${uid}/files/${id}`);

  /**
   * Edit the display name of a file belonging to you.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#put-users-me-files-id-name
   */
  public editSelfFilename = this.manufactureMethod<
    [id: string, name: string],
    Structures.File
  >(
    (id) => `/users/me/files/${id}/name`,
    'PUT',
    WITH_BODY,
    (_, name) => JSON.stringify({ name }),
  );

  /**
   * Edit the display name of a file belonging to a user.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#put-users-uid-files-id-name
   */
  public editUserFilename = this.manufactureMethod<
    [uid: string, id: string, name: string],
    Structures.File
  >(
    (uid, id) => `/users/${uid}/files/${id}/name`,
    'PUT',
    WITH_BODY,
    (_, __, name) => JSON.stringify({ name }),
  );

  /**
   * Delete the display name of a file belonging to you.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#delete-users-me-files-id-name
   */
  public deleteSelfFilename = this.manufactureMethod<
    [id: string],
    Structures.File
  >((id) => `/users/me/files/${id}/name`, 'DELETE');

  /**
   * Delete the display name of a file belonging to a user.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#delete-users-uid-files-id-name
   */
  public deleteUserFilename = this.manufactureMethod<
    [uid: string, id: string],
    Structures.File
  >((uid, id) => `/users/${uid}/files/${id}/name`, 'DELETE');

  /**
   * Edit the extension of a file belonging to you.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#put-users-me-files-id-extension
   */
  public editSelfFileExtension = this.manufactureMethod<
    [id: string, extension: string],
    Structures.File
  >(
    (id) => `/users/me/files/${id}/extension`,
    'PUT',
    WITH_BODY,
    (_, extension) => JSON.stringify({ extension }),
  );

  /**
   * Edit the extension of a file belonging to a user.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/file#put-users-uid-files-id-extension
   */
  public editUserFileExtension = this.manufactureMethod<
    [uid: string, id: string, extension: string],
    Structures.File
  >(
    (uid, id) => `/users/${uid}/files/${id}/extension`,
    'PUT',
    WITH_BODY,
    (_, __, extension) => JSON.stringify({ extension }),
  );

  /**
   * Delete a file belonging to you.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-users-me-files-id
   */
  public deleteSelfFile = this.manufactureMethod<
    [id: string],
    Structures.Success<'DELETE_FILE_SUCCESS'>
  >((id) => `/users/me/files/${id}`, 'DELETE');

  /**
   * Delete a file belonging to a user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-users-uid-files-id
   */
  public deleteUserFile = this.manufactureMethod<
    [uid: string, id: string],
    Structures.Success<'DELETE_FILE_SUCCESS'>
  >((uid, id) => `/users/${uid}/files/${id}`, 'DELETE');

  /**
   * Delete a list of files belonging to you.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-users-me-files
   */
  public deleteSelfFiles = this.manufactureMethod<
    [ids: string[]],
    Structures.Success<'DELETE_FILES_SUCCESS'>
  >('/users/me/files', 'DELETE', WITH_BODY, (ids) => JSON.stringify({ ids }));

  /**
   * Delete a list of files belonging to a user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-users-uid-files
   */
  public deleteUserFiles = this.manufactureMethod<
    [uid: string, ids: string[]],
    Structures.Success<'DELETE_FILES_SUCCESS'>
  >(
    (uid) => `/users/${uid}/files`,
    'DELETE',
    WITH_BODY,
    (_, ids) => JSON.stringify({ ids }),
  );

  /**
   * Delete an arbitrary list of files using only their IDs.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-files
   */
  public deleteArbitraryFiles = this.manufactureMethod<
    [ids: string[]],
    Structures.Success<'DELETE_FILES_SUCCESS'>
  >('/files', 'DELETE', WITH_BODY, (ids) => JSON.stringify({ ids }));

  /**
   * Delete all of your own files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-users-me-files-all
   */
  public deleteAllSelfFiles = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_FILES_SUCCESS'>
  >('/users/me/files/all', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Delete all of a user's files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/file#delete-users-uid-files-all
   */
  public deleteAllUserFiles = this.manufactureMethod<
    [user: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_FILES_SUCCESS'>
  >(
    (uid) => `/users/${uid}/files/all`,
    'DELETE',
    WITH_BODY,
    (_, passwordOrSFR) =>
      JSON.stringify({
        // more leakage
        'password':
          typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
        '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
      }),
  );

  // Instruction Methods

  /**
   * Get a list of all instructions.
   * @returns A promise that resolves to an API response containing the instructions.
   * @link https://docs.alekeagle.me/api/instruction#get-instructions
   */
  public getInstructions = this.manufactureMethodGet<
    [options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.Instruction, 'id' | 'name' | 'description'>>
  >((options) => `/instructions${this.toQueryString(options)}`);

  /**
   * Get information about an instruction.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#get-instructions-id
   */
  public getInstruction = this.manufactureMethodGet<
    [id: string],
    Structures.Instruction
  >((id) => `/instructions/${id}`);

  /**
   * Create an instruction.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#post-instructions
   */
  public createInstruction = this.manufactureMethod<
    [
      options: {
        id: string;
        name: string;
        description: string;
        steps: string[];
        content: string;
        filename?: string;
      },
    ],
    Structures.Instruction
  >('/instructions', 'POST', WITH_BODY, (options) => JSON.stringify(options));

  /**
   * Edit an instruction's name.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-name
   */
  public editInstructionName = this.manufactureMethod<
    [id: string, name: string],
    Structures.Instruction
  >(
    (id) => `/instructions/${id}/name`,
    'PUT',
    WITH_BODY,
    (_, name) => JSON.stringify({ name }),
  );

  /**
   * Edit an instruction's description.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-description
   */
  public editInstructionDescription = this.manufactureMethod<
    [id: string, description: string],
    Structures.Instruction
  >(
    (id) => `/instructions/${id}/description`,
    'PUT',
    WITH_BODY,
    (_, description) => JSON.stringify({ description }),
  );

  /**
   * Edit an instruction's content.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-content
   */
  public editInstructionFile = this.manufactureMethod<
    [id: string, content: string, filename?: string | undefined],
    Structures.Instruction
  >(
    (id) => `/instructions/${id}/file`,
    'PUT',
    WITH_BODY,
    (_, content, filename) => JSON.stringify({ content, filename }),
  );

  /**
   * Edit an instruction's steps.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-steps
   */
  public editInstructionSteps = this.manufactureMethod<
    [id: string, steps: string[]],
    Structures.Instruction
  >(
    (id) => `/instructions/${id}/steps`,
    'PUT',
    WITH_BODY,
    (_, steps) => JSON.stringify({ steps }),
  );

  /**
   * Delete an instruction's name.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#delete-instructions-id-name
   */
  public deleteInstruction = this.manufactureMethod<
    [id: string],
    Structures.Success<'DELETE_INSTRUCTION_SUCCESS'>
  >((id) => `/instructions/${id}`, 'DELETE');

  /**
   * Delete a list of instructions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/instruction#delete-instructions
   */
  public deleteInstructions = this.manufactureMethod<
    [ids: string[]],
    Structures.Success<'DELETE_INSTRUCTIONS_SUCCESS'>
  >('/instructions', 'DELETE', WITH_BODY, (ids) => JSON.stringify({ ids }));

  // KillSwitch Methods

  /**
   * Fetches a list of kill switches.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#get-killswitches
   */
  public getKillSwitches = this.manufactureMethodGet<
    [],
    Structures.List<Structures.KillSwitch>
  >('/killswitches');

  /**
   * Enables the specified kill switch.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#put-killswitches-id
   */
  public enableKillSwitch = this.manufactureMethod<
    [
      id: Enums.KillSwitches,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.List<Structures.KillSwitch>
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

  /**
   * Disables the specified kill switch.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#delete-killswitches-id
   */
  public disableKillSwitch = this.manufactureMethod<
    [
      id: Enums.KillSwitches,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.List<Structures.KillSwitch>
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

  /**
   * Disables all kill switches.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#delete-killswitches
   */
  public disableAllKillSwitches = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.List<Structures.KillSwitch>
  >('/killswitches', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  // Second Factor Methods

  /**
   * Begin the process of registering a TOTP second factor.
   * @returns A promise that resolves to an API response containing the data to complete the registration.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-totp
   */
  public beginTOTPRegistration = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.SecondFactorTOTPRegistration
  >('/users/me/2fa/totp', 'POST', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Complete the registration of a TOTP second factor.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-totp-confirm
   */
  public confirmTOTPRegistration = this.manufactureMethod<
    [token: string, name: string, code: string],
    Structures.SecondFactorRegisterSuccess
  >('/users/me/2fa/totp/confirm', 'POST', WITH_BODY, (token, name, code) =>
    JSON.stringify({ token, code, name }),
  );

  /**
   * Begin the process of registering a WebAuthn second factor.
   * @returns A promise that resolves to an API response containing the data to complete the registration.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-webauthn
   */
  public beginWebAuthnRegistration = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.SecondFactorWebAuthnRegistration
  >('/users/me/2fa/webauthn/', 'POST', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Complete the registration of a WebAuthn second factor.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-webauthn-confirm
   */
  public confirmWebAuthnRegistration = this.manufactureMethod<
    [token: string, name: string, response: RegistrationResponseJSON],
    Structures.SecondFactorRegisterSuccess
  >(
    '/users/me/2fa/webauthn/confirm',
    'POST',
    WITH_BODY,
    (token, name, response) => JSON.stringify({ token, response, name }),
  );

  /**
   * Regenerate second factor backup codes.
   * @returns A promise that resolves to an API response containing the backup codes.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-backup
   */
  public regenerateBackupCodes = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.SecondFactorBackupRegisterSuccess
  >('/users/me/2fa/backup', 'POST', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Get a list of your second factors.
   * @returns A promise that resolves to an API response containing the second factors.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-me-2fa
   */
  public getSelfSecondFactors = this.manufactureMethodGet<
    [options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.SecondFactor, 'id' | 'name'>>
  >((options) => `/users/me/2fa${this.toQueryString(options)}`);

  /**
   * Get a list of a user's second factors.
   * @returns A promise that resolves to an API response containing the second factors.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-id-2fa
   */
  public getUserSecondFactors = this.manufactureMethodGet<
    [id: string, options?: { limit?: number; offset?: number }],
    Structures.List<Pick<Structures.SecondFactor, 'id' | 'name'>>
  >((uid, options) => `/users/${uid}/2fa${this.toQueryString(options)}`);

  /**
   * Get information about one of your own second factors.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-me-2fa-id
   */
  public getSelfSecondFactor = this.manufactureMethodGet<
    [id: string],
    Structures.SecondFactor
  >((id) => `/users/me/2fa/${id}`);

  /**
   * Get information about one of a user's second factors.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-uid-2fa-id
   */
  public getUserSecondFactor = this.manufactureMethodGet<
    [uid: string, id: string],
    Structures.SecondFactor
  >((uid, id) => `/users/${uid}/2fa/${id}`);

  /**
   * Delete one of your own second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-me-2fa-id
   */
  public deleteSelfSecondFactor = this.manufactureMethod<
    [id: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_SECOND_FACTOR_SUCCESS'>
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

  /**
   * Delete one of a user's second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-uid-2fa-id
   */
  public deleteUserSecondFactor = this.manufactureMethod<
    [
      uid: string,
      id: string,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.Success<'DELETE_SECOND_FACTOR_SUCCESS'>
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

  /**
   * Delete a list of your own second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-me-2fa
   */
  public deleteSelfSecondFactors = this.manufactureMethod<
    [ids: string[], passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
  >('/users/me/2fa', 'DELETE', WITH_BODY, (ids, passwordOrSFR) =>
    JSON.stringify({
      ids,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Delete a list of a user's second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-uid-2fa
   */
  public deleteUserSecondFactors = this.manufactureMethod<
    [
      uid: string,
      ids: string[],
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
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

  /**
   * Delete all of your own second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-me-2fa-all
   */
  public deleteAllSelfSecondFactors = this.manufactureMethod<
    [passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
  >('/users/me/2fa/all', 'DELETE', WITH_BODY, (passwordOrSFR) =>
    JSON.stringify({
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  /**
   * Delete all of a user's second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-uid-2fa-all
   */
  public deleteAllUserSecondFactors = this.manufactureMethod<
    [uid: string, passwordOrSFR: string | Cumulonimbus.SecondFactorResponse],
    Structures.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
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

  // Utility Methods

  /**
   * Get the current LogLevel.
   * @returns A promise that resolves to an API response containing the log level.
   * @link https://docs.alekeagle.me/api/utility#get-loglevel
   *
   */
  public getLogLevel = this.manufactureMethodGet<[], Structures.LogLevel>(
    '/loglevel',
  );

  /**
   * Set the LogLevel.
   * @returns A promise that resolves to an API response containing the log level.
   * @link https://docs.alekeagle.me/api/utility#patch-loglevel
   */
  public setLogLevel = this.manufactureMethod<
    [
      name: Enums.LogLevel,
      passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    ],
    Structures.LogLevel
  >('/loglevel', 'PATCH', WITH_BODY, (name, passwordOrSFR) =>
    JSON.stringify({
      name,
      'password': typeof passwordOrSFR === 'string' ? passwordOrSFR : undefined,
      '2fa': typeof passwordOrSFR === 'string' ? undefined : passwordOrSFR,
    }),
  );

  // Upload Method

  /**
   * Upload a file to the Cumulonimbus API.
   * @returns A promise that resolves to an API response containing URLs to the file.
   * @link https://docs.alekeagle.me/api/file#post-upload
   */
  public async upload(
    file: string | File | Blob | ArrayBuffer | Uint8Array,
    type?: string,
  ): Promise<Cumulonimbus.APIResponse<Structures.SuccessfulUpload>> {
    const formData = new FormData();
    if (typeof file === 'string') {
      formData.append('file', new Blob([file], { type: type || 'text/plain' }));
    } else if (file instanceof Uint8Array) {
      const buffer = new ArrayBuffer(file.length);
      new Uint8Array(buffer).set(file);
      formData.append(
        'file',
        new Blob([buffer], {
          type: type || 'application/octet-stream',
        }),
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
    const res = await this.authenticatedCall<Structures.SuccessfulUpload>(
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
  export const VERSION: string = version;

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

  export class ResponseError<
    T extends keyof _Errors = keyof _Errors,
  > extends Error {
    code: T;
    message: _Errors[T]['message'];
    ratelimit: RatelimitData | null;
    constructor(response: Data.Error, ratelimit: RatelimitData | null = null) {
      super(response.message as string);
      this.code = response.code as T;
      this.message = response.message;
      this.ratelimit = ratelimit;
    }

    get name() {
      return this.constructor.name;
    }
  }

  export class MissingFieldsError extends ResponseError<'MISSING_FIELDS_ERROR'> {
    fields: string[];
    constructor(
      response: _Errors['MISSING_FIELDS_ERROR'],
      ratelimit: RatelimitData | null = null,
    ) {
      super(response, ratelimit);
      this.fields = response.fields;
    }
  }

  export class SecondFactorChallengeRequiredError extends ResponseError<'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR'> {
    // These are already assigned in the parent class, so we can safely declare them without initializing them
    token: string;
    types: ('totp' | 'backup' | 'webauthn')[];
    challenge: PublicKeyCredentialRequestOptionsJSON | undefined;
    constructor(
      response: _Errors['SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR'],
      ratelimit: RatelimitData | null = null,
    ) {
      super(response, ratelimit);
      this.token = response.token;
      this.types = response.types;
      this.challenge = response.challenge;
    }
  }

  export class ThumbnailError extends Error {
    name = 'ThumbnailError';
    code: number;
    message: string;
    constructor(response: Response) {
      super(response.statusText);
      this.code = response.status;
      this.message = response.statusText;
    }
  }

  // for some reason you can't do export {} in a namespace (very arbitrary and dumb and cruel)
  export import Data = Structures;
  export type Errors = _Errors;
  export type Successes = _Successes;
  export const KillSwitches = Enums.KillSwitches;
  export type KillSwitches = Enums.KillSwitches;
  export const PermissionFlags = Enums.PermissionFlags;
  export type PermissionFlags = Enums.PermissionFlags;
  export const PermissionGroups = Enums.PermissionGroups;
  export type PermissionGroups = Enums.PermissionGroups;
  export const LogLevel = Enums.LogLevel;
  export type LogLevel = Enums.LogLevel;
}

export default Cumulonimbus;
