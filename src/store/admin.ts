import { computed, reactive } from 'vue';
import { cloudAdapter } from '../services/cloud-adapter';
import { getStorage, setStorage } from '../services/storage';

export const ADMIN_AUTH_STORAGE_KEY = 'mini_kitchen_admin_auth';

export interface AdminState {
  isAdmin: boolean;
}

const state = reactive<AdminState>({
  isAdmin: getStorage<boolean>(ADMIN_AUTH_STORAGE_KEY, false)
});

export async function loginAdmin(passcode: string): Promise<boolean> {
  const isValid = await cloudAdapter.verifyAdmin(passcode);
  state.isAdmin = isValid;
  setStorage<boolean>(ADMIN_AUTH_STORAGE_KEY, isValid);
  return isValid;
}

export function logoutAdmin(): void {
  state.isAdmin = false;
  setStorage<boolean>(ADMIN_AUTH_STORAGE_KEY, false);
}

export function checkAdminStatus(): void {
  state.isAdmin = getStorage<boolean>(ADMIN_AUTH_STORAGE_KEY, false);
}

export const isAdmin = computed<boolean>(() => state.isAdmin);

export function useAdminStore() {
  return {
    isAdmin,
    loginAdmin,
    logoutAdmin,
    checkAdminStatus
  };
}
