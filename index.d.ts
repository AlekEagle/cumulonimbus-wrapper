declare class Cumulonimbus {
  // Omitted private properties because they are not relevant to the user.

  /**
   * The Cumulonimbus API wrapper.
   */
  constructor(token: string, clientOptions?: Cumulonimbus.ClientOptions);

  /**
   * Login to an existing account with the Cumulonimbus API.
   * @returns A promise that resolves to a Cumulonimbus instance.
   */
  public static login(
    options: {
      username: string;
      password: string;
      rememberMe?: boolean;
      tokenName?: string;
    },
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus>;

  /**
   * Register an account with the Cumulonimbus API.
   * @returns A promise that resolves to a Cumulonimbus instance.
   */
  public static register(
    options: {
      username: string;
      password: string;
      confirmPassword: string;
      email: string;
      rememberMe?: boolean;
    },
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus>;

  /**
   * Get the API status of the Cumulonimbus API.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public static getAPIStatus(
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus>;

  /**
   * Get the API status of the Cumulonimbus thumbnail API.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public static getThumbnailAPIStatus(
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus.Data.APIStatus>;

  //-- Instance Methods --//

  /**
   * Get the API status of the Cumulonimbus API. This method is an alias of the static method and is automatically populated with the client's options.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public getAPIStatus(): Promise<Cumulonimbus.Data.APIStatus>;

  /**
   * Get the API status of the Cumulonimbus thumbnail API. This method is an alias of the static method and is automatically populated with the client's options.
   * @returns A promise that resolves to the API status.
   * @link https://docs.alekeagle.me/api/#your-first-request
   */
  public getThumbnailAPIStatus(): Promise<Cumulonimbus.Data.APIStatus>;

  /**
   * Get a thumbnail of a file from the Cumulonimbus thumbnail API.
   * @returns A promise that resolves to an ArrayBuffer of the thumbnail.
   */
  public getThumbnail(
    id: string | Cumulonimbus.Data.File,
  ): Promise<ArrayBuffer>;

  /**
   * Get information about a user's session.
   * @returns A promise that resolves to an API response containing the session.
   * @link https://docs.alekeagle.me/api/session#get-users-uid-sessions-sid
   */
  public getSession(
    options?:
      | string
      | {
          session?: string; // Make session optional when user is not specified
          user?: undefined;
        }
      | {
          session: string;
          user: string;
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  /**
   * Get a list of a user's sessions.
   * @returns A promise that resolves to an API response containing the sessions.
   * @link https://docs.alekeagle.me/api/session#get-users-uid-sessions
   */
  public getSessions(
    options?:
      | string
      | {
          user?: string;
          limit?: number;
          offset?: number;
        },
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.Session, 'id' | 'name'>>
    >
  >;

  /**
   * Delete a user's session.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions-sid
   */
  public deleteSession(
    options?:
      | string
      | {
          session?: string; // Make session optional when user is not specified
          user?: undefined;
        }
      | {
          session: string; // Make session required when user is specified
          user: string;
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Delete a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions
   */
  public deleteSessions(
    sessionIDs: string[],
    user?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Delete all of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions-all
   */
  public deleteAllSessions(
    userOrIncludeSelf?: string | boolean,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Get a list of all users.
   * @returns A promise that resolves to an API response containing the users.
   * @link https://docs.alekeagle.me/api/account#get-users
   */
  public getUsers(options?: {
    limit?: number;
    offset?: number;
  }): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.User, 'id' | 'username'>>
    >
  >;

  /**
   * Get information about a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#get-users-id
   */
  public getUser(
    user?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit a user's username.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-username
   */
  public editUsername(
    options:
      | {
          username: string;
          password: string;
          user?: undefined; // Disallow specifying user when password is specified
        }
      | {
          username: string;
          user: string;
          password?: undefined; // Disallow specifying password when user is specified
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit a user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-email
   */
  public editEmail(
    options:
      | {
          email: string;
          password: string;
          user?: undefined; // Disallow specifying user when password is specified
        }
      | {
          email: string;
          user: string;
          password?: undefined; // Disallow specifying password when user is specified
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Verify a user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-verify
   */
  public verifyEmail(
    options:
      | {
          token: string;
          user?: undefined; // Disallow specifying user when token is specified
        }
      | {
          user: string;
          token?: undefined; // Disallow specifying token when user is specified
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Resend a verification email.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#get-users-id-verify
   */
  public resendVerificationEmail(
    user?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Unverify a user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-verify
   */
  public unverifyEmail(
    uid: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit a user's password.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-password
   */
  public editPassword(
    options:
      | {
          newPassword: string;
          confirmNewPassword: string;
          password: string;
          user?: undefined; // Disallow specifying user when password is specified
        }
      | {
          newPassword: string;
          confirmNewPassword: string;
          user: string;
          password?: undefined; // Disallow specifying password when user is specified
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Grants a user staff permissions.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-staff
   */
  public grantStaff(
    user: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Revokes a user's staff permissions.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-staff
   */
  public revokeStaff(
    user: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Ban a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-ban
   */
  public banUser(
    user: string,
    reason: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Unban a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-ban
   */
  public unbanUser(
    user: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Select a domain and subdomain for a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-domain
   */
  public editDomainSelection(
    options: {
      domain: string;
      subdomain?: string;
    },
    user?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Delete a user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users-id
   */
  public deleteUser(
    options:
      | {
          username: string;
          password: string;
          user?: undefined; // Disallow specifying user when password or username is specified
        }
      | {
          user: string;
          password?: undefined; // Disallow specifying password when user is specified
          username?: undefined; // Disallow specifying username when user is specified
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Delete a list of specified users.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users
   */
  public deleteUsers(
    userIDs: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Fetches a list of domains.
   * @returns A promise that resolves to an API response containing the domains.
   * @link https://docs.alekeagle.me/api/domain#get-domains
   */
  public getDomains(options?: {
    limit?: 'all' | number;
    offset?: number;
  }): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<
        Extract<Cumulonimbus.Data.Domain, 'id' | 'subdomains'>
      >
    >
  >;

  /**
   * Fetches a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#get-domains-id
   */
  public getDomain(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  /**
   * Creates a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#post-domains
   */
  public createDomain(
    id: string,
    subdomains?: boolean,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  /**
   * Allows subdomains for a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#put-domains-id-subdomains
   */
  public allowSubdomains(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  /**
   * Disallows subdomains for a domain.
   * @returns A promise that resolves to an API response containing the domain.
   * @link https://docs.alekeagle.me/api/domain#delete-domains-id-subdomains
   */
  public disallowSubdomains(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  /**
   * Deletes a domain.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/domain#delete-domains-id
   */
  public deleteDomain(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Deletes a list of domains.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/domain#delete-domains
   */
  public deleteDomains(
    domainIDs: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Gets a list of all files or files from a specific user.
   * @returns A promise that resolves to an API response containing the files.
   * @link https://docs.alekeagle.me/api/files#get-files
   */
  public getFiles(options?: {
    user?: string;
    limit?: number;
    offset?: number;
  }): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.File, 'id' | 'name'>>
    >
  >;

  /**
   * Fetches a file.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/files#get-files-id
   */
  public getFile(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  /**
   * Edit a file's display name.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/files#put-files-id-name
   */
  public editFilename(
    id: string,
    name: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  /**
   * Delete's a file's display name.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/files#delete-files-id-name
   */
  public deleteFilename(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  /**
   * Edit a file's extension.
   * @returns A promise that resolves to an API response containing the file.
   * @link https://docs.alekeagle.me/api/files#put-files-id-extension
   */
  public editFileExtension(
    id: string,
    extension: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  /**
   * Delete a file.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/files#delete-files-id
   */
  public deleteFile(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Delete a list of files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/files#delete-files
   */
  public deleteFiles(
    ids: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Delete all of a user's files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/files#delete-files-all
   */
  public deleteAllFiles(
    options:
      | {
          user: string;
          password?: undefined; // Disallow specifying password when user is specified
        }
      | {
          password: string;
          user?: undefined; // Disallow specifying user when password is specified
        },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Get a list of all instructions.
   * @returns A promise that resolves to an API response containing the instructions.
   * @link https://docs.alekeagle.me/api/instruction#get-instructions
   */
  public getInstructions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<
        Extract<Cumulonimbus.Data.Instruction, 'id' | 'name' | 'description'>
      >
    >
  >;

  /**
   * Get information about an instruction.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#get-instructions-id
   */
  public getInstruction(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  /**
   * Create an instruction.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#post-instructions
   */
  public createInstruction(options: {
    id: string;
    name: string;
    description: string;
    steps: string[];
    content: string;
    filename?: string;
  }): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  /**
   * Edit an instruction's name.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-name
   */
  public editInstructionName(
    id: string,
    name: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  /**
   * Edit an instruction's description.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-description
   */
  public editInstructionDescription(
    id: string,
    description: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  /**
   * Edit an instruction's content.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-content
   */
  public editInstructionFile(
    id: string,
    content: string,
    filename?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  /**
   * Edit an instruction's steps.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#put-instructions-id-steps
   */
  public editInstructionSteps(
    id: string,
    steps: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  /**
   * Delete an instruction's name.
   * @returns A promise that resolves to an API response containing the instruction.
   * @link https://docs.alekeagle.me/api/instruction#delete-instructions-id-name
   */
  public deleteInstruction(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Delete a list of instructions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/instruction#delete-instructions
   */
  public deleteInstructions(
    ids: string[],
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Success>>;

  /**
   * Upload a file to the Cumulonimbus API.
   * @returns A promise that resolves to an API response containing URLs to the file.
   * @link https://docs.alekeagle.me/api/file#post-upload
   */
  public upload(
    file: string | Buffer | File | Blob | ArrayBuffer,
    type?: string,
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
    constructor(response: Data.Error, ratelimit: RatelimitData | null);
  }

  export class ThumbnailError extends Error {
    code: number;
    message: string;
    constructor(response: Response);
  }
}

export default Cumulonimbus;
