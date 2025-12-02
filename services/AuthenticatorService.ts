import * as SecureStore from "expo-secure-store";
import { TOTP } from "otpauth";

const STORAGE_KEY = "auth_secrets";

export interface AuthAccount {
  name: string;
  secret: string;
}

export async function getAccounts(): Promise<AuthAccount[]> {
  const data = await SecureStore.getItemAsync(STORAGE_KEY);
  console.log(JSON.parse(data || "[]"));
  
  return data ? JSON.parse(data) : [];
}

export async function addAccount(name: string, secret: string) {
  const accounts = await getAccounts();
  accounts.push({ name, secret });
  console.log("request added ",secret);
  
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(accounts));
}
export async function updateAccount(index: number, name: string, secret: string) {
  const accounts = await getAccounts();

  if (index < 0 || index >= accounts.length) {
    throw new Error("Invalid account index");
  }

  accounts[index] = { name, secret };

  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(accounts));
  console.log(`Account at index ${index} updated to`, { name, secret });
}
export async function deleteAccount(index: number) {
  const accounts = await getAccounts();
  accounts.splice(index, 1);
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(accounts));
}
export async function searchAcc(query: string) {
  const accounts = await getAccounts();
  const lowercaseQuery = query.toLowerCase();
 return accounts.filter(pwd =>
        pwd.name.toLowerCase().includes(lowercaseQuery) ||
        pwd.secret.toLowerCase().includes(lowercaseQuery)
      );
}

export function generateCode(secret?: string): string {
  if (!secret) return ""; // return empty string if secret is missing

  const totp = new TOTP({
    secret: secret.replace(/\s+/g, ''), // remove spaces
    digits: 6,
    period: 30,
    algorithm: "SHA1",
  });

  return totp.generate();
}
export async function resetAllAccounts() {
  try {
    // Delete the main accounts key
    await SecureStore.deleteItemAsync('accounts');

    // Add any other keys you may have stored
    const otherKeys = ['allKeys', 'settings',"auth_secrets"]; 
    for (const key of otherKeys) {
      await SecureStore.deleteItemAsync(key);
    }

    console.log
    ('Success', 'All stored accounts have been deleted.');
    console.log('All accounts deleted successfully');
  } catch (err) {
    console.error('Failed to delete accounts:', err);
  }
}
