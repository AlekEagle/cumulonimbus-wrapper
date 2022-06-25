export class Cumulonimbus {
  private token: string;
  private options: Cumulonimbus.ClientOptions;

  constructor(token: string, options?: Cumulonimbus.ClientOptions);

  private call<T>(
    url: string,
    options?: Cumulonimbus.APICallRequestInit
  ): Promise<Cumulonimbus.APIResponse<T>>;

  private authenticatedCall<T>(
    url: string,
    options?: Cumulonimbus.APICallRequestInit
  ): Promise<Cumulonimbus.APIResponse<T>>;

  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers?: { [key: string]: string },
    bodyTemplate?: string | null | ((...args: T) => string)
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>>;

  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    headers?: { [key: string]: string }
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>>;

  public static login(
    user: string,
    pass: string,
    rememberMe?: boolean,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string
  ): Promise<Cumulonimbus>;

  public static register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    rememberMe?: boolean,
    options?: Cumulonimbus.ClientOptions,
    tokenName?: string
  ): Promise<Cumulonimbus>;

  public static apiSanity(
    baseURL?: string
  ): Promise<Cumulonimbus.Data.SanityCheck>;

  public static thumbnailSanity(
    baseThumbURL?: string
  ): Promise<Cumulonimbus.Data.SanityCheck>;

  public getSelfSession(
    sid?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  public getSelfSessions(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.Session>>
  >;

  public deleteSelfSession(
    sid: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  public deleteSelfSessions(
    sids: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public deleteAllSelfSessions(
    allButSelf?: boolean
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public getSelf(): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editSelf(
    password: string,
    data: {
      username?: string;
      email?: string;
      newPassword?: string;
    }
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editSelfDomain(
    domain: string,
    subdomain?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public deleteSelf(
    username: string,
    password: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public getDomains(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.Domain>>
  >;

  public getSlimDomains(): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.DomainSlim>
    >
  >;

  public getDomain(
    domain: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public getSelfFiles(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>
  >;

  public getSelfFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public deleteSelfFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public deleteSelfFiles(
    files: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public deleteAllSelfFiles(): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>
  >;

  public getInstructions(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.Instruction>
    >
  >;

  public getInstruction(
    instruction: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public upload(
    file: string | Buffer | File | Blob | ArrayBuffer
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SuccessfulUpload>>;

  public getUsers(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.User>>
  >;

  public getUser(
    id: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      staff?: boolean;
    }
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public editUserDomain(
    id: string,
    domain: string,
    subdomain?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public toggleUserBan(
    id: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public deleteUser(
    id: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  public deleteUsers(
    ids: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public createDomain(
    domain: string,
    allowsSubdomains?: boolean
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public editDomain(
    domain: string,
    allowsSubdomains: boolean
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public deleteDomain(
    domain: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Domain>>;

  public deleteDomains(
    domains: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public getFiles(
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>
  >;

  public getUserFiles(
    user: string,
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>
  >;

  public getFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public deleteFile(
    file: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.File>>;

  public deleteFiles(
    files: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public deleteAllUserFiles(
    user: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public createInstruction(
    name: string,
    displayName: string,
    description: string,
    configContent: string,
    steps: string[],
    filename?: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public editInstruction(
    name: string,
    data: {
      displayName?: string;
      description?: string;
      fileContent?: string;
      steps?: string[];
      filename?: string;
    }
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public deleteInstruction(
    name: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Instruction>>;

  public deleteInstructions(
    names: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public getUserSessions(
    user: string,
    limit?: number,
    offset?: number
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.List<Cumulonimbus.Data.Session>>
  >;

  public getUserSession(
    user: string,
    sid: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  public deleteUserSession(
    user: string,
    sid: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  public deleteUserSessions(
    user: string,
    sids: string[]
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;

  public deleteAllUserSessions(
    user: string
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.DeleteBulk>>;
}

export namespace Cumulonimbus {
  export const BASE_URL: string;
  export const BASE_THUMB_URL: string;
  export const VERSION: string;

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

    export type DomainSlim = Omit<Domain, "createdAt" | "updatedAt">;

    export interface File {
      filename: string;
      createdAt: string;
      updatedAt: string;
      userID: string;
      size: number;
    }

    export interface DeleteBulk {
      count: number;
      type: "user" | "session" | "file" | "domain" | "instruction";
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
      hello: "world";
    }
  }

  export interface ErrorCode {
    INSUFFICIENT_PERMISSIONS_ERROR: "Missing Permissions";
    INVALID_USER_ERROR: "Invalid User";
    INVALID_PASSWORD_ERROR: "Invalid Password";
    INVALID_SESSION_ERROR: "Invalid Session";
    INVALID_DOMAIN_ERROR: "Invalid Domain";
    INVALID_SUBDOMAIN_ERROR: "Invalid Subdomain: <subdomain>";
    INVALID_FILE_ERROR: "Invalid File";
    INVALID_INSTRUCTION_ERROR: "Invalid Instruction";
    INVALID_ENDPOINT_ERROR: "Invalid Endpoint";
    SUBDOMAIN_NOT_SUPPORTED_ERROR: "Subdomain Not Supported";
    DOMAIN_EXISTS_ERROR: "Domain Exists";
    USER_EXISTS_ERROR: "User Exists";
    INSTRUCTION_EXISTS_ERROR: "Instruction Exists";
    MISSING_FIELDS_ERROR: "Missing Fields: <fields>";
    BANNED_ERROR: "Banned";
    BODY_TOO_LARGE_ERROR: "Body Too Large";
    RATELIMITED_ERROR: "You Have Been Ratelimited. Please Try Again Later.";
    INTERNAL_ERROR: "Internal Server Error";
    GENERIC_ERROR: "<message>";
  }

  export class ResponseError extends Error implements Data.Error {
    code: keyof ErrorCode;
    message: ErrorCode[keyof ErrorCode];
    ratelimit: RatelimitData | null;
    constructor(response: Data.Error, ratelimit?: RatelimitData | null);
  }
}

export default Cumulonimbus;
