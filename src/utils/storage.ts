/**
 * Safe LocalStorage Utility with automatic quota management and error recovery
 * Configured for isolated Teacher Attendance database
 */

export const STORAGE_KEYS = {
  SCHOOLS: 'absensi_siswa_schools_v1',
  CURRENT_SCHOOL_ID: 'absensi_siswa_current_school_id_v1',
  GURU: 'absensi_siswa_students_v2',
  STUDENTS: 'absensi_siswa_students_v2',
  ATTENDANCE: 'absensi_siswa_attendance_v2',
  SETTINGS: 'absensi_siswa_settings_v1',
  TEACHERS: 'absensi_siswa_teachers_v2',
  CURRENT_TEACHER: 'absensi_siswa_current_teacher_v2',
  LEAVES: 'absensi_siswa_leaves_v1',
  BEHAVIOR_LOGS: 'absensi_siswa_behavior_logs_v1',
  DELETED_GURU_IDS: 'absensi_guru_deleted_ids_v2',
  THEME: 'theme',
  ACTIVE_SYNC_CODE: 'absensi_guru_active_sync_code',
  LAST_CLOUD_SYNC_TIME: 'absensi_guru_last_sync_time',
  GOOGLE_SPREADSHEET_ID: 'absensi_guru_spreadsheet_id',
  GOOGLE_SPREADSHEET_URL: 'absensi_guru_spreadsheet_url',
};

const PROTECTED_STORAGE_KEYS = new Set(Object.values(STORAGE_KEYS));

export function cleanStaleLocalStorage(): void {
  try {
    const keysToRemove: string[] = [];
    const legacyKeysToDrop = new Set([
      'absensi_siswa_students_v1',
      'absensi_siswa_attendance_v1',
      'absensi_siswa_teachers_v1',
      'absensi_siswa_current_teacher_v1',
    ]);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !PROTECTED_STORAGE_KEYS.has(key)) {
        if (
          legacyKeysToDrop.has(key) ||
          key.startsWith('absensi_cloud_sync_backup_') ||
          key.startsWith('temp_') ||
          key.startsWith('cache_')
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Unable to clean stale localStorage entries:', e);
  }
}

/**
 * Helper to sanitize an individual object by removing or truncating heavy base64 strings
 */
function sanitizeObjectPhotos(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectPhotos);
  }
  const clone = { ...obj };
  const keysToClean = ['photo', 'avatarUrl', 'attachmentPhoto', 'photoEvidence', 'photoIn', 'photoOut', 'signatureDataUrl'];
  for (const k of keysToClean) {
    if (typeof clone[k] === 'string' && (clone[k].startsWith('data:') || clone[k].length > 1500)) {
      clone[k] = '';
    }
  }
  // Also recursively sanitize nested properties like students array in CloudSyncPayload
  for (const prop of Object.keys(clone)) {
    if (Array.isArray(clone[prop])) {
      clone[prop] = clone[prop].map(sanitizeObjectPhotos);
    } else if (typeof clone[prop] === 'object' && clone[prop] !== null) {
      clone[prop] = sanitizeObjectPhotos(clone[prop]);
    }
  }
  return clone;
}

/**
 * Strips or truncates heavy base64 data URLs from JSON objects or arrays to fit within local storage limits
 */
function createLightweightCache(value: string): string {
  try {
    const parsed = JSON.parse(value);
    const sanitized = sanitizeObjectPhotos(parsed);
    return JSON.stringify(sanitized);
  } catch {
    return value;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuota) {
      console.warn(`LocalStorage quota exceeded while saving "${key}". Running cache cleanup...`);
      cleanStaleLocalStorage();

      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        try {
          const lightweight = createLightweightCache(value);
          localStorage.setItem(key, lightweight);
          console.info(`Saved lightweight cached version for "${key}" to preserve quota.`);
          return true;
        } catch (secondErr) {
          console.warn(`Failed to save cached value for "${key}" even in lightweight mode:`, secondErr);
          return false;
        }
      }
    } else {
      console.warn(`Failed to set localStorage key "${key}":`, err);
      return false;
    }
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Failed to read localStorage key "${key}":`, err);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Failed to remove localStorage key "${key}":`, err);
  }
}
