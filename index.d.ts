import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

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
    username: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    rememberMe?: boolean,
    clientOptions?: Cumulonimbus.ClientOptions,
  ): Promise<Cumulonimbus>;

  /**
   * Register an account with the Cumulonimbus API.
   * @returns A promise that resolves to a Cumulonimbus instance.
   */
  public static register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
    rememberMe?: boolean,
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
   * Creates a scoped session.
   * @returns A promise that resolves to an API response containing the created session.
   * @link https://docs.alekeagle.me/api/session#post-users-me-sessions
   */
  public createScopedSession(
    name: string,
    permissionFlags: number,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
    longLived?: boolean,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.ScopedSessionCreate>>;

  /**
   * Get information about one of your own sessions.
   * @returns A promise that resolves to an API response containing the session.
   * @link https://docs.alekeagle.me/api/session#get-users-me-sessions-sid
   */
  public getSelfSession(
    sid?: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  /**
   * Get information about one of a user's sessions.
   * @returns A promise that resolves to an API response containing the session.
   * @link https://docs.alekeagle.me/api/session#get-users-uid-sessions-sid
   */
  public getUserSession(
    uid: string,
    sid: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.Session>>;

  /**
   * Get a list of your own sessions.
   * @returns A promise that resolves to an API response containing the sessions.
   * @link https://docs.alekeagle.me/api/session#get-users-me-sessions
   */
  public getSelfSessions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.Session, 'id' | 'name'>>
    >
  >;

  /**
   * Get a list of a user's sessions.
   * @returns A promise that resolves to an API response containing the sessions.
   * @link https://docs.alekeagle.me/api/session#get-users-uid-sessions
   */
  public getUserSessions(
    uid: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Extract<Cumulonimbus.Data.Session, 'id' | 'name'>>
    >
  >;

  /**
   * Delete one of your own sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-me-sessions-sid
   */
  public deleteSelfSession(
    sid?: string,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SESSION_SUCCESS'>
    >
  >;

  /**
   * Delete one of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions-sid
   */
  public deleteUserSession(
    uid: string,
    sid: string,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SESSION_SUCCESS'>
    >
  >;

  /**
   * Delete a list of your own sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-me-sessions
   */
  public deleteSelfSessions(
    sessionIDs: string[],
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
    >
  >;

  /**
   * Delete a list of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions
   */
  public deleteUserSessions(
    uid: string,
    sessionIDs: string[],
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
    >
  >;

  /**
   * Delete all of your own sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-me-sessions-all
   */
  public deleteAllSelfSessions(
    includeSelf?: boolean,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
    >
  >;

  /**
   * Delete all of a user's sessions.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/session#delete-users-uid-sessions-all
   */
  public deleteAllUserSessions(
    uid: string,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SESSIONS_SUCCESS'>
    >
  >;

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
   * Get information about your own user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#get-users-me
   */
  public getSelf(): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Get information about a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#get-users-id
   */
  public getUser(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit your own username.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-username
   */
  public editSelfUsername(
    username: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit a user's username.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-username
   */
  public editUserUsername(
    id: string,
    username: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit your own email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-email
   */
  public editSelfEmail(
    email: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit a user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-email
   */
  public editUserEmail(
    id: string,
    email: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Verify your own email with the verification token.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#put-users-verify
   */
  public verifyEmail(
    token: string,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'VERIFY_EMAIL_SUCCESS'>>
  >;

  /**
   * Verify another user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-verify
   */
  public verifyUserEmail(
    id: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Resend a verification email for your own email.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#get-users-me-verify
   */
  public resendSelfVerificationEmail(
    id?: string,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'SEND_VERIFICATION_EMAIL_SUCCESS'>
    >
  >;

  /**
   * Resend a verification email for another user's email.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#get-users-id-verify
   */
  public resendUserVerificationEmail(
    id: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'SEND_VERIFICATION_EMAIL_SUCCESS'>
    >
  >;

  /**
   * Unverify another user's email.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-verify
   */
  public unverifyUserEmail(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit your own password.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-password
   */
  public editSelfPassword(
    newPassword: string,
    confirmNewPassword: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Edit a user's password.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-password
   */
  public editUserPassword(
    id: string,
    newPassword: string,
    confirmNewPassword: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Grants a user staff permissions.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-staff
   */
  public grantStaff(
    user: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Revokes a user's staff permissions.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-staff
   */
  public revokeStaff(
    user: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Ban a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-ban
   */
  public banUser(
    user: string,
    reason: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Unban a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#delete-users-id-ban
   */
  public unbanUser(
    user: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Selects a domain and subdomain for yourself.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-me-domain
   */
  public editSelfDomainSelection(options: {
    domain: string;
    subdomain?: string;
  }): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Select a domain and subdomain for a user.
   * @returns A promise that resolves to an API response containing the user.
   * @link https://docs.alekeagle.me/api/account#put-users-id-domain
   */
  public editDomainSelection(
    id: string,
    options: {
      domain: string;
      subdomain?: string;
    },
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.User>>;

  /**
   * Delete your own user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users-me
   */
  public deleteSelf(
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'DELETE_USER_SUCCESS'>>
  >;

  /**
   * Delete a user.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users-id
   */
  public deleteUser(
    id: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'DELETE_USER_SUCCESS'>>
  >;

  /**
   * Delete a list of specified users.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/account#delete-users
   */
  public deleteUsers(
    userIDs: string[],
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
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
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'DELETE_FILE_SUCCESS'>>
  >;

  /**
   * Delete a list of files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/files#delete-files
   */
  public deleteFiles(
    ids: string[],
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'DELETE_FILES_SUCCESS'>>
  >;

  /**
   * Delete all of your own files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/files#delete-files
   */
  public deleteAllSelfFiles(
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'DELETE_FILES_SUCCESS'>>
  >;

  /**
   * Delete all of a user's files.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/files#delete-files
   */
  public deleteAllUserFiles(
    user: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.Success<'DELETE_FILES_SUCCESS'>>
  >;

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
   * Fetches a list of kill switches.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#get-killswitches
   */
  public getKillSwitches(): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
    >
  >;

  /**
   * Enables the specified kill switch.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#put-killswitches-id
   */
  public enableKillSwitch(
    id: Cumulonimbus.KillSwitches,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
    >
  >;

  /**
   * Disables the specified kill switch.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#delete-killswitches-id
   */
  public disableKillSwitch(
    id: Cumulonimbus.KillSwitches,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
    >
  >;

  /**
   * Disables all kill switches.
   * @returns A promise that resolves to an API response containing the kill switches.
   * @link https://docs.alekeagle.me/api/killswitches#delete-killswitches
   */
  public disableAllKillSwitches(): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<Cumulonimbus.Data.KillSwitch>
    >
  >;

  /**
   * Begin the process of registering a TOTP second factor.
   * @returns A promise that resolves to an API response containing the data to complete the registration.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-totp
   */
  public beginTOTPRegistration(
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactorTOTPRegistration>
  >;

  /**
   * Complete the registration of a TOTP second factor.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-totp-confirm
   */
  public confirmTOTPRegistration(
    token: string,
    name: string,
    code: string,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactorRegisterSuccess>
  >;

  /**
   * Begin the process of registering a WebAuthn second factor.
   * @returns A promise that resolves to an API response containing the data to complete the registration.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-webauthn
   */
  public beginWebAuthnRegistration(
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactorWebAuthnRegistration>
  >;

  /**
   * Complete the registration of a WebAuthn second factor.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-webauthn-confirm
   */
  public confirmWebAuthnRegistration(
    token: string,
    name: string,
    response: RegistrationResponseJSON,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactorRegisterSuccess>
  >;

  /**
   * Regenerate second factor backup codes.
   * @returns A promise that resolves to an API response containing the backup codes.
   * @link https://docs.alekeagle.me/api/secondfactor#post-users-me-2fa-backup
   */
  public regenerateBackupCodes(
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactorBackupRegisterSuccess>
  >;

  /**
   * Get a list of your second factors.
   * @returns A promise that resolves to an API response containing the second factors.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-me-2fa
   */
  public getSelfSecondFactors(options?: {
    limit?: number;
    offset?: number;
  }): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<
        Extract<Cumulonimbus.Data.SecondFactor, 'id' | 'name'>
      >
    >
  >;

  /**
   * Get a list of a user's second factors.
   * @returns A promise that resolves to an API response containing the second factors.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-id-2fa
   */
  public getUserSecondFactors(
    id: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.List<
        Extract<Cumulonimbus.Data.SecondFactor, 'id' | 'name'>
      >
    >
  >;

  /**
   * Get information about one of your own second factors.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-me-2fa-id
   */
  public getSelfSecondFactor(
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactor>>;

  /**
   * Get information about one of a user's second factors.
   * @returns A promise that resolves to an API response containing the second factor.
   * @link https://docs.alekeagle.me/api/secondfactor#get-users-uid-2fa-id
   */
  public getUserSecondFactor(
    uid: string,
    id: string,
  ): Promise<Cumulonimbus.APIResponse<Cumulonimbus.Data.SecondFactor>>;

  /**
   * Delete one of your own second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-me-2fa-id
   */
  public deleteSelfSecondFactor(
    id: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SECOND_FACTOR_SUCCESS'>
    >
  >;

  /**
   * Delete one of a user's second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-uid-2fa-id
   */
  public deleteUserSecondFactor(
    uid: string,
    id: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SECOND_FACTOR_SUCCESS'>
    >
  >;

  /**
   * Delete a list of your own second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-me-2fa
   */
  public deleteSelfSecondFactors(
    ids: string[],
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
    >
  >;

  /**
   * Delete a list of a user's second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-uid-2fa
   */
  public deleteUserSecondFactors(
    uid: string,
    ids: string[],
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
    >
  >;

  /**
   * Delete all of your own second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-me-2fa-all
   */
  public deleteAllSelfSecondFactors(
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
    >
  >;

  /**
   * Delete all of a user's second factors.
   * @returns A promise that resolves to an API response containing the success message.
   * @link https://docs.alekeagle.me/api/secondfactor#delete-users-uid-2fa-all
   */
  public deleteAllUserSecondFactors(
    uid: string,
    passwordOrSFR: string | Cumulonimbus.SecondFactorResponse,
  ): Promise<
    Cumulonimbus.APIResponse<
      Cumulonimbus.Data.Success<'DELETE_SECOND_FACTORS_SUCCESS'>
    >
  >;

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

  export interface RequestInit extends globalThis.RequestInit {
    baseURL?: string;
    baseThumbnailURL?: string;
  }

  export interface APIResponse<T> {
    result: T;
    ratelimit: RatelimitData | null;
    response: Response;
  }

  export type SecondFactorResponse = {
    token: string;
  } & (
    | {
        type: 'totp';
        code: string;
      }
    | {
        type: 'backup';
        code: string;
      }
    | {
        type: 'webauthn';
        response: AuthenticationResponseJSON;
      }
  );

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
      permissionFlags: number;
      usedAt: string;
      createdAt: string;
      updatedAt: string;
    }

    export interface List<T> {
      count: number;
      items: T[];
    }

    export type Success<T extends keyof Successes = keyof Successes> = {
      [K in keyof Successes[T]]: Successes[T][K];
    };

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

    export type Error<T extends keyof Errors = keyof Errors> = {
      [K in keyof Errors[T]]: Errors[T][K];
    };

    export interface SuccessfulAuth {
      token: string;
      exp: number;
    }

    export interface SecondFactor {
      id: string;
      name: string;
      type: ('totp' | 'backup' | 'webauthn')[];
      createdAt: string;
      updatedAt: string;
    }

    export interface File {
      id: string;
      name: string;
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

    export interface KillSwitch {
      id: number;
      name: string;
      state: boolean;
    }

    export interface APIStatus {
      version: string;
      hello: 'world';
    }

    export interface SecondFactorBaseRegistration {
      token: string;
      exp: number;
      type: 'totp' | 'backup' | 'webauthn';
    }

    export interface SecondFactorTOTPRegistration
      extends SecondFactorBaseRegistration {
      type: 'totp';
      secret: string;
      algorithm: string;
      digits: number;
      period: number;
    }
    export interface SecondFactorWebAuthnRegistration
      extends SecondFactorBaseRegistration,
        PublicKeyCredentialCreationOptionsJSON {
      type: 'webauthn';
    }

    export interface SecondFactorRegisterSuccess {
      id: string;
      name: string;
      type: 'totp' | 'webauthn';
      codes?: string[];
    }

    export interface SecondFactorBackupRegisterSuccess {
      codes: string[];
    }

    export interface ScopedSessionCreate extends Session {
      token: string;
    }
  }

  export interface Errors {
    INVALID_ENDPOINT_ERROR: {
      code: 'INVALID_ENDPOINT_ERROR';
      message: 'Invalid Endpoint';
    };
    INSUFFICIENT_PERMISSIONS_ERROR: {
      code: 'INSUFFICIENT_PERMISSIONS_ERROR';
      message: 'Insufficient Permissions';
    };
    ENDPOINT_REQUIRES_SECOND_FACTOR_ERROR: {
      code: 'ENDPOINT_REQUIRES_SECOND_FACTOR_ERROR';
      message: 'Endpoint Requires Second Factor';
    };
    INVALID_USER_ERROR: {
      code: 'INVALID_USER_ERROR';
      message: 'Invalid User';
    };
    USER_REQUIRES_SECOND_FACTOR_ERROR: {
      code: 'USER_REQUIRES_SECOND_FACTOR_ERROR';
      message: 'User Requires Second Factor';
    };
    INVALID_USERNAME_ERROR: {
      code: 'INVALID_USERNAME_ERROR';
      message: 'Invalid Username';
    };
    INVALID_SECOND_FACTOR_ERROR: {
      code: 'INVALID_SECOND_FACTOR_ERROR';
      message: 'Invalid Second Factor';
    };
    INVALID_SECOND_FACTOR_METHOD_ERROR: {
      code: 'INVALID_SECOND_FACTOR_METHOD_ERROR';
      message: 'Invalid Second Factor Method';
    };
    INVALID_SECOND_FACTOR_RESPONSE_ERROR: {
      code: 'INVALID_SECOND_FACTOR_RESPONSE_ERROR';
      message: 'Invalid Second Factor Response';
    };
    SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR: {
      code: 'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR';
      message: 'Second Factor Challenge Required';
      token: string;
      types: ('totp' | 'backup' | 'webauthn')[];
      challenge?: PublicKeyCredentialRequestOptionsJSON;
    };
    INVALID_PASSWORD_ERROR: {
      code: 'INVALID_PASSWORD_ERROR';
      message: 'Invalid Password';
    };
    PASSWORDS_DO_NOT_MATCH_ERROR: {
      code: 'PASSWORDS_DO_NOT_MATCH_ERROR';
      message: 'Passwords Do Not Match';
    };
    INVALID_EMAIL_ERROR: {
      code: 'INVALID_EMAIL_ERROR';
      message: 'Invalid Email';
    };
    EMAIL_NOT_VERIFIED_ERROR: {
      code: 'EMAIL_NOT_VERIFIED_ERROR';
      message: 'Email Not Verified';
    };
    EMAIL_ALREADY_VERIFIED_ERROR: {
      code: 'EMAIL_ALREADY_VERIFIED_ERROR';
      message: 'Email Already Verified';
    };
    INVALID_VERIFICATION_TOKEN_ERROR: {
      code: 'INVALID_VERIFICATION_TOKEN_ERROR';
      message: 'Invalid Verification Token';
    };
    INVALID_SESSION_ERROR: {
      code: 'INVALID_SESSION_ERROR';
      message: 'Invalid Session';
    };
    INVALID_DOMAIN_ERROR: {
      code: 'INVALID_DOMAIN_ERROR';
      message: 'Invalid Domain';
    };
    SUBDOMAIN_TOO_LONG_ERROR: {
      code: 'SUBDOMAIN_TOO_LONG_ERROR';
      message: 'Subdomain Too Long';
    };
    INVALID_FILE_ERROR: {
      code: 'INVALID_FILE_ERROR';
      message: 'Invalid File';
    };
    INVALID_INSTRUCTION_ERROR: {
      code: 'INVALID_INSTRUCTION_ERROR';
      message: 'Invalid Instruction';
    };
    SUBDOMAIN_NOT_ALLOWED_ERROR: {
      code: 'SUBDOMAIN_NOT_ALLOWED_ERROR';
      message: 'Subdomain Not Allowed';
    };
    DOMAIN_EXISTS_ERROR: {
      code: 'DOMAIN_EXISTS_ERROR';
      message: 'Domain Exists';
    };
    USER_EXISTS_ERROR: {
      code: 'USER_EXISTS_ERROR';
      message: 'User Exists';
    };
    INSTRUCTION_EXISTS_ERROR: {
      code: 'INSTRUCTION_EXISTS_ERROR';
      message: 'Instruction Exists';
    };
    MISSING_FIELDS_ERROR: {
      code: 'MISSING_FIELDS_ERROR';
      message: 'Missing Fields';
      fields: string[];
    };
    BANNED_ERROR: {
      code: 'BANNED_ERROR';
      message: 'Banned';
    };
    BODY_TOO_LARGE_ERROR: {
      code: 'BODY_TOO_LARGE_ERROR';
      message: 'Body Too Large';
    };
    SERVICE_UNAVAILABLE_ERROR: {
      code: 'SERVICE_UNAVAILABLE_ERROR';
      message: 'Service Unavailable';
      feature: number;
    };
    RATELIMITED_ERROR: {
      code: 'RATELIMITED_ERROR';
      message: 'You Have Been Ratelimited. Please Try Again Later.';
    };
    INTERNAL_ERROR: {
      code: 'INTERNAL_ERROR';
      message: 'Internal Server Error';
    };
    NOT_IMPLEMENTED_ERROR: {
      code: 'NOT_IMPLEMENTED_ERROR';
      message: 'Not Implemented';
    };
  }

  export interface Successes {
    DELETE_USER_SUCCESS: {
      code: 'DELETE_USER_SUCCESS';
      message: 'User Successfully Deleted';
    };
    DELETE_USERS_SUCCESS: {
      code: 'DELETE_USERS_SUCCESS';
      message: 'Users Successfully Deleted';
      count: number;
    };
    DELETE_FILE_SUCCESS: {
      code: 'DELETE_FILE_SUCCESS';
      message: 'File Successfully Deleted';
    };
    DELETE_FILES_SUCCESS: {
      code: 'DELETE_FILES_SUCCESS';
      message: 'Files Successfully Deleted';
      count: number;
    };
    DELETE_SESSION_SUCCESS: {
      code: 'DELETE_SESSION_SUCCESS';
      message: 'Session Successfully Deleted';
    };
    DELETE_SESSIONS_SUCCESS: {
      code: 'DELETE_SESSIONS_SUCCESS';
      message: 'Sessions Successfully Deleted';
      count: number;
    };
    DELETE_DOMAIN_SUCCESS: {
      code: 'DELETE_DOMAIN_SUCCESS';
      message: 'Domain Successfully Deleted';
    };
    DELETE_DOMAINS_SUCCESS: {
      code: 'DELETE_DOMAINS_SUCCESS';
      message: 'Domains Successfully Deleted';
      count: number;
    };
    DELETE_INSTRUCTION_SUCCESS: {
      code: 'DELETE_INSTRUCTION_SUCCESS';
      message: 'Instruction Successfully Deleted';
    };
    DELETE_INSTRUCTIONS_SUCCESS: {
      code: 'DELETE_INSTRUCTIONS_SUCCESS';
      message: 'Instructions Successfully Deleted';
      count: number;
    };
    SEND_VERIFICATION_EMAIL_SUCCESS: {
      code: 'SEND_VERIFICATION_EMAIL_SUCCESS';
      message: 'Verification Email Successfully Sent';
    };
    VERIFY_EMAIL_SUCCESS: {
      code: 'VERIFY_EMAIL_SUCCESS';
      message: 'Successfully Verified Email';
    };
    DELETE_SECOND_FACTOR_SUCCESS: {
      code: 'DELETE_SECOND_FACTOR_SUCCESS';
      message: 'Second Factor Successfully Deleted';
    };
    DELETE_SECOND_FACTORS_SUCCESS: {
      code: 'DELETE_SECOND_FACTORS_SUCCESS';
      message: 'Second Factors Successfully Deleted';
      count: number;
    };
  }

  export class ResponseError<
    T extends keyof Errors = keyof Errors,
  > extends Error {
    code: T;
    message: Errors[T]['message'];
    ratelimit: RatelimitData | null;
    constructor(response: Data.Error, ratelimit: RatelimitData | null);
  }

  export class MissingFieldsError extends ResponseError<'MISSING_FIELDS_ERROR'> {
    // Its already assigned in the parent class, so we can safely declare it without initializing it
    fields: string[];
    constructor(
      response: Errors['MISSING_FIELDS_ERROR'],
      ratelimit: RatelimitData | null,
    );
  }

  export class SecondFactorChallengeRequiredError extends ResponseError<'SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR'> {
    // These are already assigned in the parent class, so we can safely declare them without initializing them
    token: string;
    types: ('totp' | 'backup' | 'webauthn')[];
    challenge: PublicKeyCredentialRequestOptionsJSON | undefined;
    constructor(
      response: Errors['SECOND_FACTOR_CHALLENGE_REQUIRED_ERROR'],
      ratelimit: RatelimitData | null,
    );
  }

  export class ThumbnailError extends Error {
    code: number;
    message: string;
    constructor(response: Response);
  }

  export enum KillSwitches {
    // Account related killSwitches
    ACCOUNT_CREATE,
    ACCOUNT_MODIFY,
    ACCOUNT_DELETE,
    ACCOUNT_EMAIL_VERIFY,
    ACCOUNT_LOGIN,
    // File related killSwitches
    FILE_CREATE,
    FILE_MODIFY,
    FILE_DELETE,
    // The Global KillSwitch
    GLOBAL,
  }
}

export default Cumulonimbus;
