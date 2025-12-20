export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roleIds?: number[];
  teamIds?: number[];
  isAdmin?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  roleIds?: number[];
  teamIds?: number[];
  isAdmin?: boolean;
  isActive?: boolean;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  leaderId?: number;
  color?: string;
  icon?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  leaderId?: number;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface LdapSearchRequest {
  username: string;
}

export interface LdapUser {
  username: string;
  email?: string;
  fullName?: string;
  ldapDn?: string;
  cn?: string;
  sn?: string;
  givenName?: string;
}

export interface LdapSettings {
  id?: number;
  urls: string;
  base: string;
  username?: string;
  userSearchBase?: string;
  userSearchFilter?: string;
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateLdapSettingsRequest {
  urls: string;
  base: string;
  username?: string;
  password?: string;
  userSearchBase?: string;
  userSearchFilter?: string;
  isEnabled?: boolean;
}

export interface LdapTestRequest {
  urls: string;
  base: string;
  username?: string;
  password?: string;
  userSearchBase?: string;
  userSearchFilter?: string;
}

export interface LdapTestResponse {
  success: boolean;
  message: string;
  errorDetails?: string;
}

