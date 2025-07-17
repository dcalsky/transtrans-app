import { Platform } from "react-native";
import { proxy } from "valtio";
import * as SecureStore from "expo-secure-store";
import { apiRequest } from "@/helpers/api";
import { AccountForDetail, GetUserDetailResponse, SubscriptionInfo } from "@/models/dto/login";
import Purchases from "react-native-purchases";
import * as schema from '@/db/schema';
import { SQLiteDatabase } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";


type UserStoreState = {
  User?: AccountForDetail;
  Token?: string;
}


export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }
}

export async function refreshUserDetail() {
  const [resp, err] = await apiRequest<null, GetUserDetailResponse>('/api/v1/GetUserDetail');
  if (err || !resp.Account) {
    return
  }
  sessionStore.User = resp.Account;
}

export async function loadStoredSession() {
  try {
    const token = await SecureStore.getItemAsync('token');
    sessionStore.Token = token || undefined;
    if (!token) {
      return
    }
    const [resp, err] = await apiRequest<null, GetUserDetailResponse>('/api/v1/GetUserDetail');
    if (err || !resp.Account) {
      return
    }
    sessionStore.User = resp.Account;
    console.log(resp.Account)
    Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY, appUserID: resp.Account.Id });
    const customerInfo = await Purchases.getCustomerInfo();
    console.log(customerInfo.entitlements.active['Pro'])
  } catch (e) {
    console.error('Failed to load stored session:', e);
  }
}

export const sessionStore = proxy<UserStoreState>({

})

export const createSession = async (user: AccountForDetail, token: string) => {
  setStorageItemAsync('token', token);
  sessionStore.User = user;
  sessionStore.Token = token;
  Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUE_CAT_API_KEY, appUserID: user.Id });
}


export const clearCurrentSession = () => {
  setStorageItemAsync('user', null);
  setStorageItemAsync('token', null);
  sessionStore.User = undefined;
  sessionStore.Token = undefined;
}

export const deleteAccount = async (db: SQLiteDatabase) => {
  const drizzleDb = drizzle(db, { schema });
  await drizzleDb.delete(schema.postsTable).execute()
  clearCurrentSession()
}
