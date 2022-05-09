export namespace Cumulonimbus {
  export const BASE_URL: string;

  export const VERSION: string;

  export interface RateLimitData {
    maxRequests: number;
    remainingRequests: number;
    resetsAt: number;
  }

  export interface ClientOptions {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  export interface APICallRequestInit extends RequestInit {
    baseURL?: string;
  }

  export namespace Data {
    export interface User {
      id: string;
      username: string;
      displayName: string;
      email: string;
      staff: boolean;
      domain: string;
      subdomain?: string;
      bannedAt?: string;
      createdAt: string;
      updatedAt: string;
      ratelimit: RateLimitData;
    }

    export interface Session {
      iat: number;
      exp: number;
      sub: string;
      name: string;
      ratelimit: RateLimitData;
    }

    export interface List<T> {
      count: number;
      items: T[];
      ratelimit: RateLimitData;
    }

    export interface Success {
      code: string;
      message?: string;
      ratelimit: RateLimitData;
    }

    export interface DeleteBulk {
      count: number;
      type: 'user' | 'session' | 'file' | 'domain' | 'instruction';
      ratelimit: RateLimitData;
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
      ratelimit: RateLimitData;
    }

    export interface Domain {
      domain: string;
      allowsSubdomains: boolean;
      createdAt: string;
      updatedAt: string;
      ratelimit: RateLimitData;
    }

    export interface Error {
      code: keyof ErrorCode;
      message: ErrorCode[keyof ErrorCode];
      ratelimit: RateLimitData;
    }

    export interface SuccessfulAuth {
      token: string;
      exp: number;
      ratelimit: RateLimitData;
    }

    export interface File {
      filename: string;
      createdAt: string;
      updatedAt: string;
      userID: string;
      size: number;
      ratelimit: RateLimitData;
    }

    export interface SuccessfulUpload {
      url: string;
      thumbnail: string;
      manage: string;
      ratelimit: RateLimitData;
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

    export interface SanityCheck {
      version: string;
      hello: 'world';
      ratelimit?: RateLimitData;
    }
  }

  export class ResponseError extends Error implements Data.Error {
    public ratelimit: RateLimitData;
    public code: keyof Data.ErrorCode;
    public message: Data.ErrorCode[typeof this.code];
    constructor(response: Data.Error);
  }
}

export class Client {
  private token: string;
  private options: Cumulonimbus.ClientOptions;
  public static login(
    user: string,
    pass: string,
    rememberMe: boolean,
    options?: Cumulonimbus.ClientOptions
  ): Promise<Client>;
  public static createAccount(
    username: string,
    password: string,
    repeatPassword: string,
    email: string,
    rememberMe: boolean,
    options?: Cumulonimbus.ClientOptions
  ): Promise<Client>;
  constructor(token: string, options?: Cumulonimbus.ClientOptions);
  private authenticatedCall<T>(
    url: string,
    options: RequestInit
  ): Promise<{ res: Response; payload: T }>;
  public getSelfSessionByID(sid?: string): Promise<Cumulonimbus.Data.Session>;
  public sanityCheck(): Promise<Cumulonimbus.Data.SanityCheck>;
  public thumbnailSanityCheck(): Promise<Cumulonimbus.Data.SanityCheck>;
  public getThumbnail(filename: string): Promise<ArrayBuffer>;
  public getSelfSessions(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.Session>>;
  public deleteSelfSessionByID(sid: string): Promise<Cumulonimbus.Data.Session>;
  public bulkDeleteSelfSessionsByID(
    sids: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public bulkDeleteAllSelfSessions(
    allButSelf: boolean
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public getSelfUser(): Promise<Cumulonimbus.Data.User>;
  public editSelfUser(
    currentPasswd: string,
    newContent: { username?: string; newPassword?: string; email?: string }
  ): Promise<Cumulonimbus.Data.User>;
  public deleteSelfUser(
    username: string,
    password: string
  ): Promise<Cumulonimbus.Data.User>;
  public editSelfDomain(
    domain: string,
    subdomain?: string
  ): Promise<Cumulonimbus.Data.User>;
  public getDomains(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.Domain>>;
  public getSelfFiles(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>;
  public getSelfFileByID(id: string): Promise<Cumulonimbus.Data.File>;
  public deleteSelfFileByID(id: string): Promise<Cumulonimbus.Data.File>;
  public bulkDeleteSelfFilesByID(
    files: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public bulkDeleteAllSelfFiles(): Promise<Cumulonimbus.Data.DeleteBulk>;
  public getInstructions(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.Instruction>>;
  public getInstructionByID(id: string): Promise<Cumulonimbus.Data.Instruction>;
  public getUsers(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.User>>;
  public getUserByID(id: string): Promise<Cumulonimbus.Data.User>;
  public editUserByID(
    id: string,
    newContent: {
      username?: string;
      password?: string;
      email?: string;
      staff?: boolean;
    }
  ): Promise<Cumulonimbus.Data.User>;
  public editUserDomain(
    id: string,
    domain: string,
    subdomain?: string | null
  ): Promise<Cumulonimbus.Data.User>;
  public toggleUserBan(id: string): Promise<Cumulonimbus.Data.User>;
  public deleteUserByID(id: string): Promise<Cumulonimbus.Data.User>;
  public bulkDeleteUsersByID(
    users: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public createDomain(
    domain: string,
    allowsSubdomains: boolean
  ): Promise<Cumulonimbus.Data.Domain>;
  public editDomainByID(
    id: string,
    allowsSubdomains: boolean
  ): Promise<Cumulonimbus.Data.Domain>;
  public deleteDomainByID(id: string): Promise<Cumulonimbus.Data.Domain>;
  public bulkDeleteDomainsByID(
    domains: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public getFiles(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>;
  public getUserFiles(
    userID: string,
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>;
  public getFileByID(fileID: string): Promise<Cumulonimbus.Data.File>;
  public deleteFileByID(fileID: string): Promise<Cumulonimbus.Data.File>;
  public bulkDeleteAllUserFiles(
    userID: string
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public bulkDeleteFilesByID(
    files: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public createInstruction(
    name: string,
    steps: string[],
    filename: string | null,
    fileContent: string,
    description: string,
    displayName: string
  ): Promise<Cumulonimbus.Data.Instruction>;
  public editInstructionByID(
    id: string,
    newContent: {
      steps?: string[];
      filename?: string | null;
      fileContent?: string;
      description?: string;
      displayName?: string;
    }
  ): Promise<Cumulonimbus.Data.Instruction>;
  public deleteInstructionByID(
    id: string
  ): Promise<Cumulonimbus.Data.Instruction>;
  public bulkDeleteInstructionsByID(
    instructions: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public getUserSessionsByID(
    id: string,
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.Session>>;
  public getUserSessionByID(
    id: string,
    sid: string
  ): Promise<Cumulonimbus.Data.Session>;
  public deleteUserSessionByID(
    id: string,
    sid: string
  ): Promise<Cumulonimbus.Data.Session>;
  public bulkDeleteUserSessionsByID(
    id: string,
    sessions: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public bulkDeleteUserSessions(
    id: string
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public uploadData(
    file: Buffer | ArrayBuffer | Blob | File,
    filename?: string
  ): Promise<Cumulonimbus.Data.SuccessfulUpload>;
}
