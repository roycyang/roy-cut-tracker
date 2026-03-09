import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './platform';

/**
 * Take a photo using native camera (on device) or return null (on web, use file input fallback).
 * Returns { base64, mimeType } or null if not available/cancelled.
 */
export async function takePhoto(source = 'prompt') {
  if (!isNative()) return null;

  const sourceMap = {
    camera: CameraSource.Camera,
    gallery: CameraSource.Photos,
    prompt: CameraSource.Prompt,
  };

  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: sourceMap[source] || CameraSource.Prompt,
      width: 1200,
      height: 1200,
    });

    return {
      base64: image.base64String,
      mimeType: `image/${image.format || 'jpeg'}`,
    };
  } catch {
    // User cancelled or permission denied
    return null;
  }
}

/**
 * Check if native camera is available.
 */
export async function checkCameraPermissions() {
  if (!isNative()) return { camera: 'granted', photos: 'granted' };
  try {
    return await Camera.checkPermissions();
  } catch {
    return { camera: 'denied', photos: 'denied' };
  }
}

export async function requestCameraPermissions() {
  if (!isNative()) return { camera: 'granted', photos: 'granted' };
  try {
    return await Camera.requestPermissions();
  } catch {
    return { camera: 'denied', photos: 'denied' };
  }
}
