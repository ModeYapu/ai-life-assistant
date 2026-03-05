/**
 * Web 端 Polyfills
 */

// AsyncStorage web implementation
import AsyncStorage from '@react-native-async-storage/async-storage';

// 如果 AsyncStorage 没有正确加载，提供 fallback
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.AsyncStorage) {
    // @ts-ignore
    window.AsyncStorage = AsyncStorage;
  }
}

// Gesture Handler web setup
import { enableWeb } from 'react-native-gesture-handler';
enableWeb();

// Safe Area Context web setup
import { initialWindowMetrics as defaultInitialWindowMetrics } from 'react-native-safe-area-context';

// Mock native modules that don't exist on web
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__DEV__ = process.env.NODE_ENV !== 'production';
}

export {};
