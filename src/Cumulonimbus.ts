export namespace Cumulonimbus {
  export const BASE_URL = 'https://alekeagle.me/api';

  export const VERSION = 'v1.0.21';

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
      staff?: string;
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
    constructor(response: Data.Error) {
      super();

      Object.setPrototypeOf(this, ResponseError.prototype);

      Object.assign(this, response);
    }
  }
}
