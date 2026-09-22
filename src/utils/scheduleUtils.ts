import { AttendanceStatus, SystemSettings, WorkDaySchedule } from '../types';

/**
 * Jadwal Standar Default Hari Kerja:
 * - Senin s/d Kamis: Masuk 06:30, Batas Toleransi Terlambat 07:15, Jam Pulang Mulai 14:00 (Aktif)
 * - Jumat: Masuk 06:30, Batas Toleransi Terlambat 07:00, Jam Pulang Mulai 11:30 (Aktif)
 * - Sabtu: Masuk 06:30, Batas Toleransi Terlambat 07:15, Jam Pulang Mulai 12:30 (Opsional / Non-aktif jika 5 hari kerja)
 * - Minggu: Libur Akhir Pekan
 */
export const DEFAULT_DAILY_SCHEDULES: { [dayIndex: number]: WorkDaySchedule } = {
  1: {
    day: 'Senin',
    dayIndex: 1,
    entryTime: '06:30',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  2: {
    day: 'Selasa',
    dayIndex: 2,
    entryTime: '06:30',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  3: {
    day: 'Rabu',
    dayIndex: 3,
    entryTime: '06:30',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  4: {
    day: 'Kamis',
    dayIndex: 4,
    entryTime: '06:30',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  5: {
    day: 'Jumat',
    dayIndex: 5,
    entryTime: '06:30',
    lateCutoffTime: '07:00', // Khusus hari Jumat batas masuk 07.00
    returnStartTime: '11:30', // Khusus hari Jumat pulang lebih awal 11.30
    isActive: true,
  },
  6: {
    day: 'Sabtu',
    dayIndex: 6,
    entryTime: '06:30',
    lateCutoffTime: '07:15',
    returnStartTime: '12:30',
    isActive: false, // Default 5 hari kerja
  },
  0: {
    day: 'Minggu',
    dayIndex: 0,
    entryTime: '07:00',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: false,
  },
};

/**
 * Mendapatkan konfigurasi jadwal kerja berdasarkan tanggal spesifik
 */
export const getDayScheduleForDate = (
  dateStr: string,
  settings?: SystemSettings
): WorkDaySchedule => {
  let dayIndex = 1;
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dayIndex = dateObj.getDay();
  } catch {
    dayIndex = 1;
  }

  // Jika admin mengonfigurasi jadwal kustom per hari
  if (settings?.dailySchedules && settings.dailySchedules[dayIndex]) {
    return settings.dailySchedules[dayIndex];
  }

  // Fallback ke default, namun jika settings.lateCutoffTime umum diubah (dan bukan hari Jumat), sesuaikan
  const base = DEFAULT_DAILY_SCHEDULES[dayIndex] || DEFAULT_DAILY_SCHEDULES[1];
  if (dayIndex !== 5 && settings?.lateCutoffTime) {
    return {
      ...base,
      lateCutoffTime: settings.lateCutoffTime,
      returnStartTime: settings.returnStartTime || base.returnStartTime,
    };
  }

  return base;
};

/**
 * Menghitung status kehadiran (Hadir vs Terlambat) dan membuat catatan presensi yang informatif
 */
export const calculateAttendanceStatusForDate = (
  timeStr: string,
  dateStr: string,
  settings?: SystemSettings
): {
  status: AttendanceStatus;
  note: string;
  minutesLate: number;
  schedule: WorkDaySchedule;
} => {
  const schedule = getDayScheduleForDate(dateStr, settings);

  const [h, m] = timeStr.split(':').map(Number);
  const [cutH, cutM] = schedule.lateCutoffTime.split(':').map(Number);

  const currentMin = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  const cutoffMin = (isNaN(cutH) ? 7 : cutH) * 60 + (isNaN(cutM) ? 15 : cutM);

  const diff = currentMin - cutoffMin;

  if (diff > 0) {
    return {
      status: 'Terlambat',
      minutesLate: diff,
      schedule,
      note: `Terlambat ${diff} menit (Masuk ${timeStr} WITA, Batas ${schedule.day} ${schedule.lateCutoffTime})`,
    };
  }

  return {
    status: 'Hadir',
    minutesLate: 0,
    schedule,
    note: `Hadir Tepat Waktu (Masuk ${timeStr} WITA)`,
  };
};

/**
 * Mengecek apakah waktu sekarang sudah masuk jam pulang untuk tanggal tersebut
 */
export const isReturnTimeWindow = (
  timeStr: string,
  dateStr: string,
  settings?: SystemSettings
): boolean => {
  const schedule = getDayScheduleForDate(dateStr, settings);
  const [h, m] = timeStr.split(':').map(Number);
  const [retH, retM] = schedule.returnStartTime.split(':').map(Number);

  const currentMin = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  const returnMin = (isNaN(retH) ? 14 : retH) * 60 + (isNaN(retM) ? 0 : retM);

  return currentMin >= returnMin;
};
