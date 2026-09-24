import { Student, AttendanceRecord, SystemSettings, Teacher } from '../types';
import {
  saveCloudSyncToFirestore,
  fetchCloudSyncFromFirestore,
  syncAllStudentsToFirestore,
  syncAllAttendanceToFirestore,
  syncAllTeachersToFirestore,
  saveSettingsToFirestore,
  fetchAllStudentsFromFirestore,
  fetchAllAttendanceFromFirestore,
  fetchAllTeachersFromFirestore,
  fetchSettingsFromFirestore,
} from '../services/firestoreService';
import { safeSetItem, safeGetItem } from './storage';

export interface CloudSyncPayload {
  syncCode: string;
  lastSyncedAt: string;
  schoolName: string;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  teachers: Teacher[];
}

const CLOUD_STORAGE_KEY_PREFIX = 'absensi_cloud_sync_code_';

/**
 * Generates a clean 6-digit uppercase Cloud Sync ID for the school
 */
export const generateSyncCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SD-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Saves current local database to Cloud/Sync Storage and Firestore
 */
export const saveToCloudSync = async (
  syncCode: string,
  data: {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    settings: SystemSettings;
    teachers: Teacher[];
  }
): Promise<{ success: boolean; syncedAt: string; message: string }> => {
  try {
    const cleanCode = (syncCode || generateSyncCode()).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') || generateSyncCode();
    
    const syncedAt = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const payload: CloudSyncPayload = {
      syncCode: cleanCode,
      lastSyncedAt: syncedAt,
      schoolName: data.settings?.schoolName || 'SD Negeri',
      students: Array.isArray(data.students) ? data.students : [],
      attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
      settings: data.settings || {
        lateCutoffTime: '07:00',
        schoolName: 'SD Negeri',
        schoolAddress: '',
        academicYear: '2024/2025',
      },
      teachers: Array.isArray(data.teachers) ? data.teachers : [],
    };

    // Store in browser local storage as backup cache (safely handled against quota)
    safeSetItem(`${CLOUD_STORAGE_KEY_PREFIX}${payload.syncCode}`, JSON.stringify(payload));
    safeSetItem('absensi_active_sync_code', payload.syncCode);
    safeSetItem('absensi_last_cloud_sync_time', syncedAt);

    // Save snapshot to Firestore Cloud Database
    let firestoreErrorDetails: string | null = null;
    try {
      await saveCloudSyncToFirestore(payload);
      
      // Propagate data in parallel batches to main Firestore collections
      const syncTasks: Promise<void>[] = [];

      if (payload.students.length > 0) {
        syncTasks.push(syncAllStudentsToFirestore(payload.students));
      }
      if (payload.settings) {
        syncTasks.push(saveSettingsToFirestore(payload.settings));
      }
      if (payload.teachers.length > 0) {
        syncTasks.push(syncAllTeachersToFirestore(payload.teachers));
      }
      if (payload.attendanceRecords.length > 0) {
        syncTasks.push(syncAllAttendanceToFirestore(payload.attendanceRecords));
      }

      await Promise.all(syncTasks);
    } catch (fsErr: any) {
      console.error('Firestore primary sync error:', fsErr);
      firestoreErrorDetails = fsErr?.message || String(fsErr);
    }

    if (firestoreErrorDetails) {
      return {
        success: false,
        syncedAt,
        message: `Gagal menyimpan ke Firestore Cloud: ${firestoreErrorDetails}. Cadangan lokal tersimpan di perangkat ini (Kode: ${payload.syncCode}).`,
      };
    }

    return {
      success: true,
      syncedAt,
      message: `Sinkronisasi Cloud Berhasil! (${payload.students.length} Guru/PTK, ${payload.attendanceRecords.length} Rekap Absensi tersimpan ke Firestore dengan Kode Sync: ${payload.syncCode})`,
    };
  } catch (err: any) {
    console.error('Cloud sync failed:', err);
    return {
      success: false,
      syncedAt: '',
      message: `Gagal melakukan sinkronisasi cloud: ${err?.message || 'Periksa koneksi internet Anda.'}`,
    };
  }
};

/**
 * Fetches database using 3-tier multi-tier auto-recovery:
 * Tier 1: Cloud Sync Snapshot document (`cloud_sync/{syncCode}`)
 * Tier 2: Direct Firestore collections fallback (`students`, `attendance`, `teachers`, `settings`)
 * Tier 3: LocalStorage backup cache
 */
export const fetchFromCloudSync = async (
  syncCode: string
): Promise<{ success: boolean; payload?: CloudSyncPayload; message: string }> => {
  const cleanCode = syncCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  if (!cleanCode) {
    return {
      success: false,
      message: 'Kode Sync tidak boleh kosong.',
    };
  }

  // Tier 1: Try Cloud Sync Snapshot from Firestore
  try {
    const firestorePayload = await fetchCloudSyncFromFirestore(cleanCode);
    if (firestorePayload && Array.isArray(firestorePayload.students) && firestorePayload.students.length > 0) {
      return {
        success: true,
        payload: firestorePayload,
        message: `Berhasil memuat data dari Firebase Cloud Sync Snapshot (${firestorePayload.students.length} Guru/PTK, ${firestorePayload.attendanceRecords?.length || 0} Catatan Absensi)`,
      };
    }
  } catch (fsErr) {
    console.warn('Tier 1 (Snapshot) notice, proceeding to Tier 2 (Direct Collections):', fsErr);
  }

  // Tier 2: Direct Firestore Collections Fallback
  try {
    const [directStudents, directAttendance, directTeachers, directSettings] = await Promise.all([
      fetchAllStudentsFromFirestore(),
      fetchAllAttendanceFromFirestore(),
      fetchAllTeachersFromFirestore(),
      fetchSettingsFromFirestore(),
    ]);

    if (directStudents && directStudents.length > 0) {
      const recoveredPayload: CloudSyncPayload = {
        syncCode: cleanCode,
        lastSyncedAt: new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        schoolName: directSettings?.schoolName || 'SD Negeri',
        students: directStudents,
        attendanceRecords: directAttendance || [],
        teachers: directTeachers || [],
        settings: directSettings || {
          lateCutoffTime: '07:00',
          schoolName: 'SD Negeri',
          schoolAddress: '',
          academicYear: '2024/2025',
        },
      };

      // Cache the recovered data locally
      safeSetItem(`${CLOUD_STORAGE_KEY_PREFIX}${cleanCode}`, JSON.stringify(recoveredPayload));

      return {
        success: true,
        payload: recoveredPayload,
        message: `Berhasil memuat data dari Koleksi Utama Firestore (${directStudents.length} Guru/PTK, ${directAttendance.length} Catatan Absensi, ${directTeachers.length} Akun Guru)`,
      };
    }
  } catch (tier2Err) {
    console.warn('Tier 2 (Direct collections) notice, proceeding to Tier 3 (Local Storage):', tier2Err);
  }

  // Tier 3: LocalStorage backup fallback
  try {
    const raw = safeGetItem(`${CLOUD_STORAGE_KEY_PREFIX}${cleanCode}`);
    if (raw) {
      const payload: CloudSyncPayload = JSON.parse(raw);
      if (Array.isArray(payload.students) && payload.students.length > 0) {
        return {
          success: true,
          payload,
          message: `Berhasil memuat data dari Cadangan Lokal Perangkat (${payload.students.length} Guru/PTK, ${payload.attendanceRecords?.length || 0} Catatan Absensi)`,
        };
      }
    }
  } catch (err: any) {
    console.error('Tier 3 fallback failed:', err);
  }

  return {
    success: false,
    message: `Data untuk Kode Sync "${cleanCode}" tidak ditemukan di Snapshot Firestore, Koleksi Database Utama, maupun Cadangan Lokal. Pastikan kode sudah benar atau lakukan sinkronisasi dari perangkat utama.`,
  };
};
