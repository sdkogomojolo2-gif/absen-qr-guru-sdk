/**
 * Safe LocalStorage Utility with automatic quota management and error recovery
 * Configured for isolated Teacher Attendance database
 */

export const STORAGE_KEYS = {
  SCHOOLS: 'absensi_guru_schools_v3',
  CURRENT_SCHOOL_ID: 'absensi_guru_current_school_id_v3',
  GURU: 'absensi_guru_ptk_v3',
  ATTENDANCE: 'absensi_guru_records_v3',
  SETTINGS: 'absensi_guru_settings_v3',
  TEACHERS: 'absensi_guru_teachers_v3',
  CURRENT_TEACHER: 'absensi_guru_current_teacher_v3',
  LEAVES: 'absensi_guru_leaves_v3',
  BEHAVIOR_LOGS: 'absensi_guru_behavior_logs_v3',
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
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !PROTECTED_STORAGE_KEYS.has(key)) {
        // Clear all old student database keys so data never mixes up
        if (
          key.startsWith('absensi_siswa_') ||
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
 * Strips or truncates heavy base64 data URLs from JSON objects to fit within local storage limits
 */
function createLightweightCache(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.map((item) => {
        if (typeof item === 'object' && item !== null) {
          const clone = { ...item };
          if (typeof clone.photo === 'string' && clone.photo.startsWith('data:') && clone.photo.length > 2000) {
            clone.photo = '';
          }
          if (typeof clone.avatarUrl === 'string' && clone.avatarUrl.startsWith('data:') && clone.avatarUrl.length > 2000) {
            clone.avatarUrl = '';
          }
          if (typeof clone.attachmentPhoto === 'string' && clone.attachmentPhoto.startsWith('data:') && clone.attachmentPhoto.length > 2000) {
            clone.attachmentPhoto = '';
          }
          return clone;
        }
        return item;
      });
      return JSON.stringify(sanitized);
    }
    return value;
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
