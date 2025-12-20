import api from './api';
import { LdapSearchRequest, LdapUser } from '../types/Admin';

export const ldapService = {
  searchUsers: async (request: LdapSearchRequest): Promise<LdapUser[]> => {
    const response = await api.post<LdapUser[]>('/admin/ldap/search', request);
    return response.data;
  },

  importUser: async (ldapUser: LdapUser, roleIds?: number[]): Promise<any> => {
    const response = await api.post('/admin/ldap/import', {
      username: ldapUser.username,
      email: ldapUser.email,
      fullName: ldapUser.fullName,
      ldapDn: ldapUser.ldapDn,
      roleIds: roleIds || [],
    });
    return response.data;
  },
};

