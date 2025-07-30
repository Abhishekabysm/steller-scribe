import { useState, useEffect } from 'react';

/**
 * A hook to manage state that persists for the current session.
 * Uses sessionStorage to store the value.
 *
 * @param key The key to use in sessionStorage.
 * @param initialValue The initial value if not found in sessionStorage.
 * @returns A stateful value, and a function to update it.
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

