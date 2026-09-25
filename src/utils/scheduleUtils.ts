import { AttendanceStatus, SystemSettings, WorkDaySchedule } from '../types';

/**
 * Jadwal Standar Default Hari Kerja:
 * - Senin s/d Kamis: Jam Masuk 07:00, Batas Toleransi Terlambat 07:15, Jam Pulang Mulai 14:00 (Aktif)
 * - Jumat: Jam Masuk 07:00, Batas Toleransi Terlambat 07:00, Jam Pulang Mulai 11:30 (Aktif)
 * - Sabtu: Jam Masuk 07:00, Batas Toleransi Terlambat 07:15, Jam Pulang Mulai 12:30 (Opsional / Non-aktif jika 5 hari kerja)
 * - Minggu: Libur Akhir Pekan
 */
export const DEFAULT_DAILY_SCHEDULES: { [dayIndex: number]: WorkDaySchedule } = {
  1: {
    day: 'Senin',
    dayIndex: 1,
    entryTime: '07:00',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  2: {
    day: 'Selasa',
    dayIndex: 2,
    entryTime: '07:00',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  3: {
    day: 'Rabu',
    dayIndex: 3,
    entryTime: '07:00',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  4: {
    day: 'Kamis',
    dayIndex: 4,
    entryTime: '07:00',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    isActive: true,
  },
  5: {
    day: 'Jumat',
    dayIndex: 5,
    entryTime: '07:00',
    lateCutoffTime: '07:00', // Khusus hari Jumat batas masuk 07.00
    returnStartTime: '11:30', // Khusus hari Jumat pulang lebih awal 11.30
    isActive: true,
  },
  6: {
    day: 'Sabtu',
    dayIndex: 6,
    entryTime: '07:00',
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

  // Jika admin mengonfigurasi jadwal kustom per hari (dukung index number maupun string key dari Firestore)
  const customSched =
    settings?.dailySchedules?.[dayIndex] ||
    (settings?.dailySchedules as any)?.[String(dayIndex)];

  if (customSched) {
    return {
      ...customSched,
      returnStartTime: customSched.returnStartTime || settings?.returnStartTime || (dayIndex === 5 ? '11:30' : '14:00'),
      lateCutoffTime: customSched.lateCutoffTime || (dayIndex === 5 ? '07:00' : (settings?.lateCutoffTime || '07:15')),
    };
  }

  // Fallback ke default, namun jika settings kustom diubah
  const base = DEFAULT_DAILY_SCHEDULES[dayIndex] || DEFAULT_DAILY_SCHEDULES[1];
  if (dayIndex !== 5) {
    return {
      ...base,
      lateCutoffTime: settings?.lateCutoffTime || base.lateCutoffTime,
      returnStartTime: settings?.returnStartTime || base.returnStartTime,
    };
  } else {
    const jumatSched = (settings?.dailySchedules as any)?.['5'] || settings?.dailySchedules?.[5];
    return {
      ...base,
      lateCutoffTime: jumatSched?.lateCutoffTime || base.lateCutoffTime,
      returnStartTime: jumatSched?.returnStartTime || base.returnStartTime,
    };
  }
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

  const isRealtime = settings?.entryTimeMode === 'realtime';
  const displayRecordedTime = isRealtime ? timeStr : (schedule.lateCutoffTime || schedule.entryTime || '07:15');

  return {
    status: 'Hadir',
    minutesLate: 0,
    schedule,
    note: isRealtime
      ? `Hadir Tepat Waktu (Masuk ${timeStr} WITA)`
      : `Hadir Tepat Waktu (Masuk ${displayRecordedTime} WITA)`,
  };
};

/**
 * Mendapatkan jam masuk resmi sesuai jadwal dan batas jam untuk presensi
 * Mode 'cutoff' -> batas jam toleransi masuk (Senin-Kamis 07:15, Jumat 07:00)
 * Mode 'entry' -> jam jadwal masuk standar (07:00)
 * Mode 'realtime' -> waktu scan kamera
 */
export const getScheduledEntryTimeForDate = (
  dateStr: string,
  settings?: SystemSettings,
  mode?: 'cutoff' | 'entry' | 'realtime'
): string => {
  const schedule = getDayScheduleForDate(dateStr, settings);
  const selectedMode = mode || settings?.entryTimeMode || 'cutoff';

  if (selectedMode === 'entry') {
    return schedule.entryTime || '07:00';
  }

  // Default 'cutoff' (batas jam): e.g. '07:15', Jumat: '07:00'
  return schedule.lateCutoffTime || schedule.entryTime || '07:15';
};

/**
 * Mengambil jam masuk yang seharusnya ditampilkan / dicatat pada rekap & dashboard.
 * Jika mode terjadwal aktif (default):
 * - Status 'Hadir' (atau bukan Terlambat): Menggunakan batas jam masuk / jam jadwal (misal: 07:15 WITA, atau Jumat 07:00 WITA), bukan detik realtime scan.
 * - Status 'Terlambat': Menggunakan jam kedatangan sebenarnya (tanpa detik, misal 07:45 WITA).
 * - Status izin/sakit/dinas: Menggunakan strip '-' atau batas jam sesuai kebutuhan.
 */
export const resolveAttendanceEntryTime = (
  record?: {
    time?: string;
    timeIn?: string;
    status?: AttendanceStatus | string;
    date?: string;
  } | null,
  settings?: SystemSettings
): string => {
  if (!record) return '';

  const mode = settings?.entryTimeMode || 'cutoff';
  if (mode === 'realtime') {
    const raw = record.timeIn || record.time || '';
    return raw;
  }

  // Jika guru Hadir atau Dinas Luar atau tidak terlambat:
  if (record.status === 'Hadir' || record.status === 'Dinas Luar') {
    return getScheduledEntryTimeForDate(record.date || '', settings, mode);
  }

  // Jika Terlambat: tampilkan waktu terlambat yang rapi (HH:mm)
  if (record.status === 'Terlambat') {
    const raw = record.timeIn || record.time || '';
    if (raw.includes(':')) {
      const parts = raw.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return raw;
  }

  // Jika izin, sakit, alpa -> tidak ada jam masuk resmi
  if (record.status === 'Izin' || record.status === 'Sakit' || record.status === 'Alpa') {
    return '';
  }

  // Fallback default jika ada record
  const scheduledTime = getScheduledEntryTimeForDate(record.date || '', settings, mode);
  return scheduledTime;
};

/**
 * Mengambil jam pulang yang seharusnya ditampilkan / dicatat pada rekap & dashboard.
 */
export const resolveAttendanceReturnTime = (
  record?: {
    timeOut?: string;
    note?: string;
    status?: AttendanceStatus | string;
    date?: string;
  } | null,
  settings?: SystemSettings
): string => {
  if (!record) return '';

  const schedule = getDayScheduleForDate(record.date || '', settings);
  const scheduledReturn =
    schedule.returnStartTime ||
    settings?.returnStartTime ||
    (schedule.day === 'Jumat' ? '11:30' : '14:00');

  if (record.timeOut && record.timeOut.trim()) {
    const raw = record.timeOut.trim();

    // Deteksi apakah record merupakan hasil auto-checkout sistem:
    // 1) Note berisi 'Otomatis Lengkap Sampai Jam Pulang'
    // 2) ATAU autoCheckOutWithIn aktif DAN raw adalah default jam pulang sistem terdahulu (14:00 / 11:30 / 12:30 / scheduledReturn)
    const isAutoCheckoutRecord =
      Boolean(record.note && record.note.includes('Otomatis Lengkap Sampai Jam Pulang')) ||
      (settings?.autoCheckOutWithIn !== false && (raw === '14:00' || raw === '11:30' || raw === '12:30' || raw === scheduledReturn));

    if (isAutoCheckoutRecord) {
      // Selalu ikuti jam pulang resmi sesuai jadwal yang baru dikonfigurasi admin!
      return scheduledReturn;
    }

    if (raw.includes(':')) {
      const parts = raw.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return raw;
  }

  // Jika hadir dan sistem otomatis checkout
  if (record.status === 'Hadir' || record.status === 'Terlambat') {
    return scheduledReturn;
  }

  return '';
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
