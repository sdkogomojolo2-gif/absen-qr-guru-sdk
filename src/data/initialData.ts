import { Guru, AttendanceRecord, AttendanceStatus, SystemSettings, Teacher, School } from '../types';
import { MALE_BW_AVATAR, FEMALE_BW_AVATAR } from '../utils/avatars';
import { DEFAULT_DAILY_SCHEDULES } from '../utils/scheduleUtils';

export const DEFAULT_PRIMARY_SCHOOL_ID = 'sdk-ogomojolo';

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'sdk-ogomojolo',
    code: 'SDK-OGM',
    name: 'SDK OGOMOJOLO',
    address: 'Desa Ogomojolo, Kec. Dondo, Kab. Tolitoli, Sulawesi Tengah',
    city: 'Tolitoli',
    academicYear: '2025/2026',
    lateCutoffTime: '07:15',
    returnStartTime: '14:00',
    headmasterName: 'Drs. H. Mulyadi, M.Pd',
    headmasterNip: '19680512 199403 1 005',
    contactEmail: 'Fadli46046@gmail.com',
    contactPhone: '082291234567',
    isActive: true,
    createdAt: '2025-01-01',
    notes: 'Sekolah Induk Presensi Guru (SDK Ogomojolo)',
  },
];

export const DEFAULT_SETTINGS: SystemSettings = {
  schoolId: DEFAULT_PRIMARY_SCHOOL_ID,
  lateCutoffTime: '07:15',
  returnStartTime: '14:00',
  entryTimeMode: 'cutoff', // Default: Sesuai batas jam masuk (Senin-Kamis 07:15, Jumat 07:00)
  dailySchedules: DEFAULT_DAILY_SCHEDULES,
  enablePhotoCapture: true,
  autoCheckOutWithIn: true,
  enableQuickBulkAttendance: true,
  whatsappTargetPhone: '',
  whatsappTargetName: 'Kepala Sekolah / Grup Guru',
  schoolName: 'SDN Kecil Ogomojolo',
  schoolAddress: 'Jl. Kemiri, Dusun 5 Ogomojolo, Kecamatan Palasa',
  nss: '101180816027',
  npsn: '40206214',
  jumlahKS: 1,
  jumlahGuru: 8,
  jumlahTU: 1,
  academicYear: '2025/2026',
  headmasterName: 'RAHMAT, S.Pd., M.Pd',
  headmasterNip: '19851204 200903 1 002',
  korwilName: 'Drs. AGUSTAN, M.A.P',
  korwilNip: '19670807 199702 1 001',
  korwilTitle: 'Koordinator Wilayah Satuan Pendidikan',
  korwilKecamatan: 'Kecamatan Palasa',
  signatureCity: 'Palasa Lambori',
  schoolCity: 'Palasa',
  schoolRegency: 'PEMERINTAH KABUPATEN PARIGI MOUTONG',
  schoolDepartment: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  cardTitle: 'KARTU IDENTITAS & PRESENSI DIGITAL GURU',
  cardValidityText: 'KARTU RESMI PENDIDIK & TENAGA KEPENDIDIKAN (PTK)',
  headmasterSignatureType: 'none',
  customHolidays: {
    '2026-09-01': 'Libur Semester',
    '2026-09-02': 'Libur Semester',
    '2026-09-03': 'Libur Semester',
    '2026-09-04': 'Libur Semester',
  },
};

export const JABATAN_GURU_LIST = [
  'Kepala Sekolah',
  'Guru Kelas 1',
  'Guru Kelas 2',
  'Guru Kelas 3',
  'Guru Kelas 4',
  'Guru Kelas 5',
  'Guru Kelas 6',
  'Guru PJOK (Penjas)',
  'Guru Pendidikan Agama',
  'Guru Bahasa Inggris',
  'Guru Seni Budaya (SBdP)',
  'Operator Sekolah / Dapodik',
  'Tenaga Administrasi / TU',
  'Pengelola Perpustakaan',
];

// Alias for backwards compatibility
export const SD_CLASSES = JABATAN_GURU_LIST;
export const SMP_CLASSES = JABATAN_GURU_LIST;

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-admin',
    name: 'MOH. FADLI, S.Pd.',
    nip: '199903202025211020',
    email: 'Fadli46046@gmail.com',
    pin: 'Hanin231221',
    subject: 'Guru Kelas 5 & Operator Sistem',
    role: 'admin',
    teacherType: 'admin',
  },
];

export const DUMMY_GURU_IDS: readonly string[] = [
  'guru-101',
  'guru-102',
  'guru-103',
  'guru-104',
  'guru-105',
  'guru-106',
  'guru-107',
  'guru-108',
  'guru-109',
  'guru-110',
  'guru-111',
  'std-1001',
  'std-1002',
  'std-1003',
  'std-1004',
  'std-1005',
  'std-1006',
  'std-1007',
  'std-1008',
  'std-1009',
  'std-1010',
  'std-1011',
  'std-1012',
  'std-1013',
  'std-1014',
];

export const isDummyGuruId = (id?: string | null): boolean => {
  if (!id) return false;
  return DUMMY_GURU_IDS.includes(id);
};

export const INITIAL_GURU: Guru[] = [];

// Compatibility alias
export const INITIAL_STUDENTS: Guru[] = INITIAL_GURU;

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateInitialAttendance = (_todayStr?: string): AttendanceRecord[] => {
  return [];
};
