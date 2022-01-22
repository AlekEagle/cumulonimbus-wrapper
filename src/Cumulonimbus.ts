export namespace Cumulonimbus {
  export const BASE_URL = 'https://alekeagle.me/api';

  export const VERSION = 'v1.0.2';

  export interface RateLimitData {
    maxRequests: number;
    remainingRequests: number;
    resetsAt: number;
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
      code: string;
      message: string;
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
  }
  export class ResponseError extends Error implements Data.Error {
    public ratelimit: RateLimitData;
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
