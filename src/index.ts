import fetch from "isomorphic-fetch";
import FormData from "isomorphic-form-data";

// Get version from package.json
const version = require("./package.json").version;

// deep merge two objects without overwriting existing properties
function merge(obj1: any, obj2: any) {
  const result = { ...obj1 };
  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (typeof obj2[key] === "object") {
        result[key] = merge(result[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }
  return result;
}

class Cumulonimbus {
  private token: string;
  private options: Cumulonimbus.ClientOptions;

  constructor(token: string, options?: Cumulonimbus.ClientOptions) {
    this.token = token;
    this.options = options || {};
  }

  private async call<T>(
    url: string,
    options: Cumulonimbus.APICallRequestInit = {}
  ): Promise<Cumulonimbus.APIResponse<T>> {
    const opts = merge(options, {
      headers: {
        "User-Agent": `Cumulonimbus/${version}`,
      },
    });

    const res = await fetch(
      (options.baseURL || this.options.baseURL) + url,
      opts
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get("X-Ratelimit-Limit")) {
      ratelimit = {
        max: Number(res.headers.get("X-RateLimit-Limit")),
        remaining: Number(res.headers.get("X-RateLimit-Remaining")),
        reset: Number(res.headers.get("X-RateLimit-Reset")),
      };
    }

    // Check if the response is a 413, and if so, construct a new BODY_TOO_LARGE error, as we can't be sure the server returns a proper error
    if (res.status === 413) {
      throw new Cumulonimbus.ResponseError(
        {
          code: "BODY_TOO_LARGE_ERROR",
          message: "Body Too Large",
        },
        ratelimit
      );
    }

    try {
      let json = await res.json();
      if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);
      else return { result: json, ratelimit, response: res };
    } catch (error) {
      if (error instanceof Cumulonimbus.ResponseError) throw error;
      else
        throw new Cumulonimbus.ResponseError(
          {
            code: "GENERIC_ERROR",
            message: null,
          },
          ratelimit
        );
    }
  }

  private async authenticatedCall<T>(
    url: string,
    options: Cumulonimbus.APICallRequestInit = {}
  ) {
    const opts = merge(options, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return this.call<T>(url, opts);
  }

  private manufactureMethod<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    method: string,
    headers: { [key: string]: string } = {},
    bodyTemplate: string | null | ((...args: T) => string) = null
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>> {
    return async (...args: T): Promise<Cumulonimbus.APIResponse<M>> => {
      try {
        let endpoint = (
          typeof endpointTemplate === "string"
            ? () => endpointTemplate
            : endpointTemplate
        )(...args);
        let res = await this.authenticatedCall<M>(endpoint, {
          method,
          headers,
          body: (typeof bodyTemplate === "function"
            ? bodyTemplate
            : () => bodyTemplate)(...args),
        });

        if (res.response.ok) return res;
        else throw new Error("https://youtu.be/snKJPEVbQoE?t=20");
      } catch (error) {
        throw error;
      }
    };
  }

  private manufactureMethodGet<T extends any[], M>(
    endpointTemplate: string | ((...args: T) => string),
    headers: { [key: string]: string } = {}
  ): (...args: T) => Promise<Cumulonimbus.APIResponse<M>> {
    return this.manufactureMethod<T, M>(endpointTemplate, "GET", headers, null);
  }

  public static async login(
    user: string,
    pass: string,
    rememberMe: boolean = false,
    options?: Cumulonimbus.ClientOptions
  ): Promise<Cumulonimbus> {
    const res = await fetch(
      options && options.baseURL ? options.baseURL : Cumulonimbus.BASE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `Cumulonimbus/${version}`,
        },
        body: JSON.stringify({
          user,
          pass,
          rememberMe,
        }),
      }
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get("X-Ratelimit-Limit")) {
      ratelimit = {
        max: Number(res.headers.get("X-RateLimit-Limit")),
        remaining: Number(res.headers.get("X-RateLimit-Remaining")),
        reset: Number(res.headers.get("X-RateLimit-Reset")),
      };
    }

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, options);
  }

  public static async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    rememberMe: boolean = false,
    options?: Cumulonimbus.ClientOptions
  ): Promise<Cumulonimbus> {
    const res = await fetch(
      options && options.baseURL ? options.baseURL : Cumulonimbus.BASE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `Cumulonimbus/${version}`,
        },
        body: JSON.stringify({
          username,
          email,
          password,
          rememberMe,
          repeatPassword: confirmPassword,
        }),
      }
    );

    let ratelimit: Cumulonimbus.RatelimitData | null = null;

    if (res.headers.get("X-Ratelimit-Limit")) {
      ratelimit = {
        max: Number(res.headers.get("X-RateLimit-Limit")),
        remaining: Number(res.headers.get("X-RateLimit-Remaining")),
        reset: Number(res.headers.get("X-RateLimit-Reset")),
      };
    }

    const json = await res.json();

    if (!res.ok) throw new Cumulonimbus.ResponseError(json, ratelimit);

    return new Cumulonimbus(json.token, options);
  }
}

namespace Cumulonimbus {
  export const BASE_URL = "https://alekeagle.me/api";
  export const VERSION = version;

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

  // Give

  export class ResponseError extends Error implements Data.Error {
    code: keyof ErrorCode;
    message: ErrorCode[keyof ErrorCode];
    ratelimit: RatelimitData | null;
    constructor(response: Data.Error, ratelimit: RatelimitData | null = null) {
      super(response.message);
      this.code = response.code as keyof ErrorCode;
      this.message = response.message as ErrorCode[keyof ErrorCode];
      this.ratelimit = ratelimit;
    }
  }
}

export default Cumulonimbus;
