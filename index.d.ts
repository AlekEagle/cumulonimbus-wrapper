export namespace Cumulonimbus {
  export const BASE_URL: string;

  export const VERSION: string;

  export namespace Data {
    export interface User {
      id: string;
      username: string;
      displayName: string;
      email: string;
      staff?: string;
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

    export interface List<T> {
      count: number;
      items: T[];
    }

    export interface Success {
      code: string;
      message?: string;
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

    export interface Domain {
      domain: string;
      allowsSubdomains: boolean;
      createdAt: string;
      updatedAt: string;
    }

    export interface Error {
      code: string;
      message: string;
    }

    export interface SuccessfulAuth {
      token: string;
      exp: number;
    }

    export interface File {
      filename: string;
      createdAt: string;
      updatedAt: string;
      userID: string;
      size: number;
    }

    export interface SuccessfulUpload {
      url: string;
      thumbnail: string;
      manage: string;
    }
  }

  export class ResponseError extends Error implements Data.Error {
    public code: string;
    public message: string;
    public fields?: string[]; // Present only when code is 'MISSING_FIELDS_ERROR'
    public parsedSubdomain?: string; // Present only when code is 'INVALID_SUBDOMAIN_ERROR'
    constructor(response: Data.Error);
  }
}

export class Client {
  private token: string;
  public static login(
    user: string,
    pass: string,
    rememberMe: boolean
  ): Promise<Client>;
  public static createAccount(
    username: string,
    password: string,
    email: string,
    rememberMe: boolean
  ): Promise<Client>;
  constructor(token: string);
  private authenticatedCall<T>(
    url: string,
    options: RequestInit
  ): Promise<{ res: Response; payload: T }>;
  public getSelfSessionByID(sid?: string): Promise<Cumulonimbus.Data.Session>;
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
  public updateSelfDomain;
}
