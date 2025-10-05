import { apiBaseUrl } from '@shared-config/network.config';

export const API_ROOT = apiBaseUrl;

export const buildEndpoint = (path: string): string => {
  if (!path.startsWith('/')) {
    return `${API_ROOT}/${path}`;
  }
  return `${API_ROOT}${path}`;
};
