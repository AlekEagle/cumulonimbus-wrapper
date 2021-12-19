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
  public updateSelfDomain(
    domain: string,
    subdomain?: string
  ): Promise<Cumulonimbus.Data.User>;
  public getAllDomains(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.Domain>>;
  public getAllSelfFiles(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>;
  public getSelfFileByID(id: string): Promise<Cumulonimbus.Data.File>;
  public deleteSelfFileByID(id: string): Promise<Cumulonimbus.Data.File>;
  public bulkDeleteSelfFilesByID(
    files: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public BulkDeleteAllSelfFiles(): Promise<Cumulonimbus.Data.DeleteBulk>;
  public getAllInstructions(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.Instruction>>;
  public getInstructionByID(id: string): Promise<Cumulonimbus.Data.Instruction>;
  public getUserByID(id: string): Promise<Cumulonimbus.Data.User>;
  public editUserByID(
    id: string,
    newContent: { username?: string; password?: string; email?: string }
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
  public createNewDomain(
    domain: string,
    allowsSubdomains: boolean
  ): Promise<Cumulonimbus.Data.Domain>;
  public updateDomainByID(
    id: string,
    allowsSubdomains: boolean
  ): Promise<Cumulonimbus.Data.Domain>;
  public deleteDomainByID(id: string): Promise<Cumulonimbus.Data.Domain>;
  public bulkDeleteDomainsByID(
    domains: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public getAllFiles(
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>;
  public getAllUserFiles(
    userID: string,
    limit?: number,
    offset?: number
  ): Promise<Cumulonimbus.Data.List<Cumulonimbus.Data.File>>;
  public getFileByID(fileID: string): Promise<Cumulonimbus.Data.File>;
  public deleteFileByID(fileID: string): Promise<Cumulonimbus.Data.File>;
  public bulkDeleteFilesByID(
    files: string[]
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public createInstruction(
    name: string,
    steps: string[],
    filename: string,
    fileContent: string,
    description: string,
    displayName: string
  ): Promise<Cumulonimbus.Data.Instruction>;
  public updateInstructionByID(
    id: string,
    newContent: {
      steps?: string[];
      filename?: string;
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
  public bulkDeleteAllUserSessions(
    id: string
  ): Promise<Cumulonimbus.Data.DeleteBulk>;
  public uploadData(
    file: Buffer | ArrayBuffer | Blob | File
  ): Promise<Cumulonimbus.Data.SuccessfulUpload>;
}
