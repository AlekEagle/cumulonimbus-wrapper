export namespace Cumulonimbus {
  export const BASE_URL = 'http://localhost:8000/api';

  export const VERSION = 'v1.0.0';

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
    constructor(response: Data.Error) {
      super();

      Object.setPrototypeOf(this, ResponseError.prototype);

      Object.assign(this, response);
    }
  }
}
