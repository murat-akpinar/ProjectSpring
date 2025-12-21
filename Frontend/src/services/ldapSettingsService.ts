import api from './api';
import { LdapSettings, UpdateLdapSettingsRequest, LdapTestRequest, LdapTestResponse } from '../types/Admin';

export const ldapSettingsService = {
  getLdapSettings: async (): Promise<LdapSettings> => {
    const response = await api.get<LdapSettings>('/admin/ldap/settings');
    return response.data;
  },

  updateLdapSettings: async (request: UpdateLdapSettingsRequest): Promise<LdapSettings> => {
    const response = await api.put<LdapSettings>('/admin/ldap/settings', request);
    return response.data;
  },

  testLdapConnection: async (request: LdapTestRequest): Promise<LdapTestResponse> => {
    const response = await api.post<LdapTestResponse>('/admin/ldap/settings/test', request);
    return response.data;
  },

  testLdapConnectionAuto: async (): Promise<LdapTestResponse> => {
    const response = await api.post<LdapTestResponse>('/admin/ldap/settings/test/auto');
    return response.data;
  },
};

