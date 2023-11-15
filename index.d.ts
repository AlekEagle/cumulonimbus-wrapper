// The Cumulonimbus API wrapper.
declare class Cumulonimbus {
  // The token of the Cumulonimbus wrapper instance.
  private token: string;

  // The options of the Cumulonimbus wrapper instance.
  private options: Cumulonimbus.ClientOptions;

  // Creates a new Cumulonimbus API wrapper.
  constructor(token: string, options?: Cumulonimbus.ClientOptions);

  // The generic API call method used throughout the wrapper.
  private call<T>(
    url: string,
    options?: Cumulonimbus.APICallRequestInit,
  ): Promise<Cumulonimbus.APIResponse<T>>;

  //Similar to the generic API call method, but it includes credentials in the request.
  private authenticatedCall<T>(
    url: string,
    options?: Cumulonimbus.APICallRequestInit,
  ): Promise<Cumulonimbus.APIResponse<T>>;

  // A method to manufacture callables for the API.
  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers?: { [key: string]: string },
    bodyTemplate?: string | null | ((...args: T) => string),
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>>;

  // Similar to manufactureMethod, but is only used for GET requests and does not include the bodyTemplate parameter.
  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    headers?: { [key: string]: string },
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>>;

  public static login(
    username: string,
    password: string,
    rememberMe?: boolean,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string,
  ): Promise<Cumulonimbus>;

  public static register(
    username: string,
    email: string,
    password: string,
    repeatPassword: string,
    rememberMe?: boolean,
    options?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus>;

  public static getAPIStatus(
    options?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus>;

  public static getThumbnailAPIStatus(
    options?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus>;

  public getThumbnail(
    id: string | Cumulonimbus.Data.File,
  ): Promise<ArrayBuffer>;

  public getSession(
    sid?: string,
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  public getSessions(
    uid?: string,
    limit?: number,
    offset?: number,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Exclude<Cumulonimbus.Data.Session, 'exp'>>
    >
  >;

  public deleteSession(
    sid: string,
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteSessions(
    sids: string[],
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteAllSessions(
    uid?: string,
    includeSelf?: boolean,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public getUsers(
    limit?: number,
    offset?: number,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.User, 'id' | 'username'>>
    >
  >;

  public getUser(
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editUsername(
    username: string,
    password?: string,
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editEmail(
    email: string,
    password?: string,
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public verifyEmail(
    uid: string,
    token?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public resendVerificationEmail(
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public unverifyEmail(
    uid: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public editPassword(
    newPassword: string,
    confirmNewPassword: string,
    oldPassword?: string,
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public grantStaff(
    uid: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public revokeStaff(
    uid: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public banUser(
    uid: string,
    reason: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public unbanUser(
    uid: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editDomainSelection(
    domain: string,
    subdomain?: string,
    uid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public deleteUser(
    uid?: string,
    username?: string,
    password?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteUsers(
    uids: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public getDomains(
    limit?: 'all' | number,
    offset?: number,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<
        Extract<Cumulonimbus.Data.Domain, 'id' | 'subdomains'>
      >
    >
  >;

  public getDomain(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public createDomain(
    id: string,
    subdomains?: boolean,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public allowSubdomains(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public disallowSubdomains(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public deleteDomain(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteDomains(
    ids: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public getFiles(
    uid?: string,
    limit?: number,
    offset?: number,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.File, 'id' | 'name'>>
    >
  >;

  public getFile(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public editFilename(
    id: string,
    name?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public editFileExtension(
    id: string,
    extension: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public deleteFile(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteFiles(
    ids: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteAllFiles(
    user?: string,
    password?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public getInstructions(
    limit?: number,
    offset?: number,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<
        Extract<Cumulonimbus.Data.Instruction, 'id' | 'name' | 'description'>
      >
    >
  >;

  public getInstruction(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public createInstruction(
    id: string,
    name: string,
    description: string,
    steps: string[],
    content: string,
    filename?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public editInstructionName(
    id: string,
    name: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public editInstructionDescription(
    id: string,
    description: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public editInstructionFile(
    id: string,
    content: string,
    filename?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public editInstructionSteps(
    id: string,
    steps: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public deleteInstruction(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public deleteInstructions(
    ids: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  public upload(
    file: string | Buffer | File | Blob | ArrayBuffer,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SuccessfulUpload>>;
}

declare namespace Cumulonimbus {
  export const BASE_URL = 'https://alekeagle.me/api';
  export const BASE_THUMBNAIL_URL = 'https://previews.alekeagle.me';
  export const VERSION: string;

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
      count?: number;
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
      name?: string;
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
    constructor(response: Data.Error, ratelimit: RatelimitData | null);
  }

  export class ThumbnailError extends Error {
    code: number;
    message: string;
    constructor(response: Response);
  }
}

export default Cumulonimbus;
