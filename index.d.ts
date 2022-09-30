// The Cumulonimbus API wrapper.
export class Cumulonimbus {
  // The token of the Cumulonimbus wrapper instance.
  private token: string;

  // The options of the Cumulonimbus wrapper instance.
  private options: Cumulonimbus.ClientOptions;

  // Creates a new Cumulonimbus API wrapper.
  constructor(token: string, options?: Cumulonimbus.ClientOptions);

  // The generic API call method used throughout the wrapper.
  private call<T>(
    url: string,
    options?: Cumulonimbus.APICallRequestInit
  ): Promise<Cumulonimbus.APIResponse<T>>;

  //Similar to the generic API call method, but it includes credentials in the request.
  private authenticatedCall<T>(
    url: string,
    options?: Cumulonimbus.APICallRequestInit
  ): Promise<Cumulonimbus.APIResponse<T>>;

  // A method to manufacture callables for the API.
  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers?: { [key: string]: string },
    bodyTemplate?: string | null | ((...args: T) => string)
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>>;

  // Similar to manufactureMethod, but is only used for GET requests and does not include the bodyTemplate parameter.
  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    headers?: { [key: string]: string }
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>>;

  // Login to the API with a username and password.
  // See: https://docs.alekeagle.me/api/user/session.html#post-user-session
  public static login(
    username: string,
    password: string,
    rememberMe?: boolean,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string
  ): Promise<Cumulonimbus>;

  // Register a new user with the API.
  // See: https://docs.alekeagle.me/api/user/account.html#post-user
  public static register(
    username: string,
    email: string,
    password: string,
    repeatPassword: string,
    rememberMe?: boolean,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string
  ): Promise<Cumulonimbus>;

  // Get the API's current status.
  // See: https://docs.alekeagle.me/api/#any-api
  public static apiSanity(
    baseURL?: string
  ): Promise<Cumulonimbus.Data.SanityCheck>;

  // Get the thumbnail API's current status.
  // See: https://docs.alekeagle.me/api/thumbnail/general.html#any
  public static thumbnailSanity(
    baseThumbURL?: string
  ): Promise<Cumulonimbus.Data.SanityCheck>;

  // Get a thumbnail from the thumbnail API.
  // See: https://docs.alekeagle.me/api/thumbnail/general.html#get-file
  public getThumbnail(
    file: string | Cumulonimbus.Data.File
  ): Promise<ArrayBuffer>;

  // Get the current session used to authenticate.
  // See: https://docs.alekeagle.me/api/user/session.html#get-user-session
  public getSelfSession(
    sid?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  // Get all sessions for the authenticated user.
  // See: https://docs.alekeagle.me/api/user/session.html#get-user-sessions
  public getSelfSessions(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.Session>>
  >;

  // Delete a specific session for the authenticated user.
  // See: https://docs.alekeagle.me/api/user/session.html#delete-user-session-id
  public deleteSelfSession(
    sid: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  // Bulk delete multiple sessions for the authenticated user.
  // See: https://docs.alekeagle.me/api/user/session.html#delete-user-sessions
  public deleteSelfSessions(
    sids: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Delete all sessions for the authenticated user.
  // See: https://docs.alekeagle.me/api/user/session.html#delete-user-sessions-all
  public deleteAllSelfSessions(
    allButSelf?: boolean
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Get the current authenticated user.
  // See: https://docs.alekeagle.me/api/user/account.html#get-user
  public getSelf(): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Update the current authenticated user.
  // See: https://docs.alekeagle.me/api/user/account.html#patch-user
  public editSelf(
    password: string,
    data: {
      username?: string;
      email?: string;
      newPassword?: string;
    }
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Update the current authenticated user's domain and subdomain selection.
  // See: https://docs.alekeagle.me/api/user/account.html#patch-user-domain
  public editSelfDomain(
    domain: string,
    subdomain?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Delete the current authenticated user.
  // See: https://docs.alekeagle.me/api/user/account.html#delete-user
  public deleteSelf(
    username: string,
    password: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Get the list of usable domains.
  // See: https://docs.alekeagle.me/api/user/domain.html#get-domains
  public getDomains(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.Domain>>
  >;

  // Get the list of usable domains, stripped of unnecessary data for use in a dropdown.
  // See: https://docs.alekeagle.me/api/user/domain.html#get-domains-slim
  public getSlimDomains(): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.DomainSlim>
    >
  >;

  // Get details about a specific domain.
  // See: https://docs.alekeagle.me/api/user/domain.html#get-domain-id
  public getDomain(
    domain: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  // Get all files owned by the authenticated user.
  // See: https://docs.alekeagle.me/api/user/file.html#get-user-files
  public getSelfFiles(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>
  >;

  // Get a specific file owned by the authenticated user.
  // See: https://docs.alekeagle.me/api/user/file.html#get-user-file-id
  public getSelfFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  // Delete a specific file owned by the authenticated user.
  // See: https://docs.alekeagle.me/api/user/file.html#delete-user-file-id
  public deleteSelfFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  // Bulk delete multiple files owned by the authenticated user.
  // See: https://docs.alekeagle.me/api/user/file.html#delete-user-files
  public deleteSelfFiles(
    files: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Delete all files owned by the authenticated user.
  // See: https://docs.alekeagle.me/api/user/file.html#delete-user-files-all
  public deleteAllSelfFiles(): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>
  >;

  // Get a list of all setup instructions for various services.
  // See: https://docs.alekeagle.me/api/user/instruction.html#get-instructions
  public getInstructions(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.Instruction>
    >
  >;

  // Get specific setup instructions for a service.
  // See: https://docs.alekeagle.me/api/user/instruction.html#get-instruction-id
  public getInstruction(
    instruction: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  // Upload data or a file.
  // See: https://docs.alekeagle.me/api/user/file.html#post-upload
  public upload(
    file: string | Buffer | File | Blob | ArrayBuffer
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SuccessfulUpload>>;

  // Get a list of all users.
  // See: https://docs.alekeagle.me/api/admin/account.html#get-users
  public getUsers(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.User>>
  >;

  // Get a specific user.
  // See: https://docs.alekeagle.me/api/admin/account.html#get-user-id
  public getUser(
    id: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Update a specific user.
  // See: https://docs.alekeagle.me/api/admin/account.html#patch-user-id
  public editUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      staff?: boolean;
    }
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Update a specific user's domain and subdomain selection.
  // See: https://docs.alekeagle.me/api/admin/account.html#patch-user-id-domain
  public editUserDomain(
    id: string,
    domain: string,
    subdomain?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Toggle the ban status of a specific user.
  // See: https://docs.alekeagle.me/api/admin/account.html#patch-user-id-ban
  public toggleUserBan(
    id: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Delete a specific user.
  // See: https://docs.alekeagle.me/api/admin/account.html#delete-user-id
  public deleteUser(
    id: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  // Bulk delete multiple users.
  // See: https://docs.alekeagle.me/api/admin/account.html#delete-users
  public deleteUsers(
    ids: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Create a new domain.
  // See: https://docs.alekeagle.me/api/admin/domain.html#post-domain
  public createDomain(
    domain: string,
    allowsSubdomains?: boolean
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  // Update a specific domain.
  // See: https://docs.alekeagle.me/api/admin/domain.html#patch-domain-id
  public editDomain(
    domain: string,
    allowsSubdomains: boolean
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  // Delete a specific domain.
  // See: https://docs.alekeagle.me/api/admin/domain.html#delete-domain-id
  public deleteDomain(
    domain: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  // Bulk delete multiple domains.
  // See: https://docs.alekeagle.me/api/admin/domain.html#delete-domains
  public deleteDomains(
    domains: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Get a list of all files.
  // See: https://docs.alekeagle.me/api/admin/file.html#get-files
  public getFiles(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>
  >;

  // Get a list of all files owned by a specific user.
  // See: https://docs.alekeagle.me/api/admin/file.html#get-user-id-files
  public getUserFiles(
    user: string,
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>
  >;

  // Get a specific file.
  // See: https://docs.alekeagle.me/api/admin/file.html#get-file-id
  public getFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  // Delete a specific file.
  // See: https://docs.alekeagle.me/api/admin/file.html#delete-file-id
  public deleteFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  // Bulk delete multiple files.
  // See: https://docs.alekeagle.me/api/admin/file.html#delete-files
  public deleteFiles(
    files: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Delete all files owned by a specific user.
  // See: https://docs.alekeagle.me/api/admin/file.html#delete-user-id-files-all
  public deleteAllUserFiles(
    user: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Create new setup instructions for a specific service.
  // See: https://docs.alekeagle.me/api/admin/instruction.html#post-instruction
  public createInstruction(
    name: string,
    displayName: string,
    description: string,
    configContent: string,
    steps: string[],
    filename?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  // Update a specific setup instruction.
  // See: https://docs.alekeagle.me/api/admin/instruction.html#patch-instruction-id
  public editInstruction(
    name: string,
    data: {
      displayName?: string;
      description?: string;
      fileContent?: string;
      steps?: string[];
      filename?: string | null;
    }
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  // Delete a specific setup instruction.
  // See: https://docs.alekeagle.me/api/admin/instruction.html#delete-instruction-id
  public deleteInstruction(
    name: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  // Bulk delete multiple setup instructions.
  // See: https://docs.alekeagle.me/api/admin/instruction.html#delete-instructions
  public deleteInstructions(
    names: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Get a list of all sessions for a specific user.
  // See: https://docs.alekeagle.me/api/admin/session.html#get-user-id-sessions
  public getUserSessions(
    user: string,
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.Session>>
  >;

  // Get a specific session of a specific user.
  // See: https://docs.alekeagle.me/api/admin/session.html#get-user-id-session-sid
  public getUserSession(
    user: string,
    sid: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  // Delete a specific session of a specific user.
  // See: https://docs.alekeagle.me/api/admin/session.html#delete-user-id-session-sid
  public deleteUserSession(
    user: string,
    sid: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  // Bulk delete multiple sessions of a specific user.
  // See: https://docs.alekeagle.me/api/admin/session.html#delete-user-id-sessions
  public deleteUserSessions(
    user: string,
    sids: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  // Delete all sessions of a specific user.
  // See: https://docs.alekeagle.me/api/admin/session.html#delete-user-id-sessions-all
  public deleteAllUserSessions(
    user: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;
}

export namespace Cumulonimbus {
  // The default base URL for the API.
  export const BASE_URL: string;
  // The default base URL for the thumbnail API.
  export const BASE_THUMB_URL: string;
  // The wrapper version.
  export const VERSION: string;

  // The structure of ratelimit data from the API.
  export interface RatelimitData {
    max: number;
    remaining: number;
    reset: number;
  }

  // Options for the API wrapper.
  export interface ClientOptions {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  // Options for API requests. These are not normally used outside of the wrapper.
  export interface APICallRequestInit extends RequestInit {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  // The structure of API responses.
  export interface APIResponse<T> {
    result: T;
    ratelimit: RatelimitData | null;
    response: Response;
  }

  // Various data structures used and returned by the API.
  export namespace Data {
    // The structure of a list of items.
    export interface List<T> {
      count: number;
      items: T[];
    }

    // The structure of an API error.
    export interface Error {
      code: string;
      message: string;
    }

    // The structure of an API success.
    export interface Success {
      code: string;
      message?: string;
    }

    // The structure of a user.
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

    // The structure of a session.
    export interface Session {
      iat: number;
      exp: number;
      sub: string;
      name: string;
    }

    // The structure of a domain.
    export interface Domain {
      domain: string;
      allowsSubdomains: boolean;
      createdAt: string;
      updatedAt: string;
    }

    // The structure of a slim domain.
    export type DomainSlim = Omit<Domain, 'createdAt' | 'updatedAt'>;

    // The structure of a file.
    export interface File {
      filename: string;
      createdAt: string;
      updatedAt: string;
      userID: string;
      size: number;
    }

    // The structure of a bulk delete.
    export interface DeleteBulk {
      count: number;
      type: 'user' | 'session' | 'file' | 'domain' | 'instruction';
    }

    // The structure of a setup instruction.
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

    // The structure of a successful authentication.
    export interface SuccessfulAuth {
      token: string;
      exp: number;
    }

    // The structure of a successful upload.
    export interface SuccessfulUpload {
      url: string;
      thumbnail: string;
      manage: string;
    }

    // The structure of a API sanity check.
    export interface SanityCheck {
      version: string;
      hello: 'world';
    }
  }

  // All error codes and possible messages returned by the API.
  export interface ErrorCode {
    INSUFFICIENT_PERMISSIONS_ERROR: 'Missing Permissions';
    INVALID_USER_ERROR: 'Invalid User';
    INVALID_PASSWORD_ERROR: 'Invalid Password';
    INVALID_SESSION_ERROR: 'Invalid Session';
    INVALID_DOMAIN_ERROR: 'Invalid Domain';
    INVALID_SUBDOMAIN_ERROR: 'Invalid Subdomain';
    INVALID_FILE_ERROR: 'Invalid File';
    INVALID_INSTRUCTION_ERROR: 'Invalid Instruction';
    INVALID_ENDPOINT_ERROR: 'Invalid Endpoint';
    SUBDOMAIN_NOT_SUPPORTED_ERROR: 'Subdomain Not Supported';
    DOMAIN_EXISTS_ERROR: 'Domain Exists';
    USER_EXISTS_ERROR: 'User Exists';
    INSTRUCTION_EXISTS_ERROR: 'Instruction Exists';
    MISSING_FIELDS_ERROR: 'Missing Fields';
    BANNED_ERROR: 'Banned';
    BODY_TOO_LARGE_ERROR: 'Body Too Large';
    RATELIMITED_ERROR: 'You Have Been Ratelimited. Please Try Again Later.';
    INTERNAL_ERROR: 'Internal Server Error';
    GENERIC_ERROR: '';
  }

  // The error that is thrown when an API call fails.
  export class ResponseError extends Error implements Data.Error {
    code: keyof ErrorCode;
    message: ErrorCode[keyof ErrorCode];
    ratelimit: RatelimitData | null;
    parsedSubdomain?: string;
    fields?: string[];
    constructor(response: Data.Error, ratelimit?: RatelimitData | null);
  }

  // The error that is thrown when fetching a thumbnail fails.
  export class ThumbnailError extends Error {
    code: number;
    message: string;
    constructor(response: Response);
  }
}

export default Cumulonimbus;
