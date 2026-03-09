import { Capacitor } from '@capacitor/core';

export function isNative() {
  return Capacitor.isNativePlatform();
}

export function isIOS() {
  return Capacitor.getPlatform() === 'ios';
}

export function isAndroid() {
  return Capacitor.getPlatform() === 'android';
}

export function isWeb() {
  return Capacitor.getPlatform() === 'web';
}
