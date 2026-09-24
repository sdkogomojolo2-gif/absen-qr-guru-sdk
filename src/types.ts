export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Dinas Luar' | 'Izin' | 'Sakit' | 'Alpa';

export type Gender = 'Laki-laki' | 'Perempuan';

export type EmploymentStatus = 'PNS' | 'PPPK' | 'GTY' | 'Honorer / GTT' | 'Tenaga Kependidikan';

export interface School {
  id: string; // unique slug e.g. 'sdk-ogomojolo', 'sd-inpres-2-ulatan'
  code: string; // e.g. 'SDK-OGM'
  name: string; // e.g. 'SDK OGOMOJOLO'
  address: string;
  city?: string;
  academicYear: string;
  lateCutoffTime: string; // e.g. '07:15'
  returnStartTime?: string; // e.g. '14:00' (Jam mulai presensi pulang)
  headmasterName?: string;
  headmasterNip?: string;
  logoUrl?: string;
  iihhBeresDatabaseId?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

/**
 * Data Guru & Tenaga Kependidikan (PTK)
 */
export interface Guru {
  id: string;
  schoolId?: string;
  nip?: string; // NIP 18 digit / NUPTK 16 digit / NIK
  name: string; // Nama Lengkap beserta Gelar
  position?: string; // Jabatan / Tugas: Guru Kelas 1-6, Guru PJOK, Guru PAI, Kepala Sekolah, Operator / TU
  employmentStatus?: EmploymentStatus;
  rankGrade?: string; // Golongan / Pangkat e.g. III/a, III/b, IX, dll.
  gender: Gender;
  phone?: string; // No WhatsApp pribadi guru untuk notifikasi & pengingat
  email?: string;
  avatarUrl?: string;
  photo?: string; // Base64 image
  createdAt?: string;

  // Compatibility aliases & extra fields
  nis?: string;
  nisn?: string;
  nuptk?: string;
  classRoom?: string;
  parentPhone?: string;
  birthPlace?: string;
  birthDate?: string;
  address?: string;
  schoolDistance?: string; // e.g. "3.000 M" or "500 M"
  subject?: string;
  homeroomClass?: string;
}

// Student alias for seamless backwards compatibility
export type Student = Guru;

/**
 * Catatan Presensi Harian Guru & PTK (Datang & Pulang)
 */
export interface AbsensiGuru {
  id: string;
  schoolId?: string;
  guruId?: string;
  nip?: string;
  guruName?: string;
  position?: string;
  employmentStatus?: string;
  date: string; // YYYY-MM-DD
  time: string; // Jam Masuk (HH:mm:ss)
  timeIn?: string; // Jam Masuk (HH:mm:ss)
  timeOut?: string; // Jam Pulang (HH:mm:ss)
  status: AttendanceStatus;
  note?: string; // Keterangan tugas / alasan
  scannedVia: 'QR Camera' | 'Manual Input' | 'Simulator';
  activityLog?: string; // Catatan kegiatan mengajar/tugas harian guru
  photoEvidence?: string; // Bukti foto saat presensi (masuk)
  photoIn?: string; // Foto snapshot saat absen masuk
  photoOut?: string; // Foto snapshot saat absen pulang
  nuptk?: string;

  // Compatibility aliases
  studentId?: string;
  nis?: string;
  studentName?: string;
  classRoom?: string;
  teacherId?: string;
  teacherName?: string;
  teacherRole?: string;
  teacherType?: string;
  teacherSubject?: string;
}

// AttendanceRecord alias for seamless backwards compatibility
export type AttendanceRecord = AbsensiGuru;

export type CardTemplateId =
  | 'tricolor_modern'
  | 'navy_gold'
  | 'emerald_gold'
  | 'modern_minimalis'
  | 'pelita'
  | 'seraphic'
  | 'nusantara';

export interface WorkDaySchedule {
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  dayIndex: number; // 0=Minggu, 1=Senin, ..., 5=Jumat, 6=Sabtu
  entryTime: string; // Jam buka absen masuk (e.g. "06:30")
  lateCutoffTime: string; // Batas jam masuk / toleransi terlambat (e.g. "07:15" atau "07:00")
  returnStartTime: string; // Jam mulai boleh absen pulang (e.g. "14:00" atau "11:30")
  isActive: boolean; // Status hari kerja (true=hari sekolah, false=libur)
}

export interface SystemSettings {
  schoolId?: string;
  lateCutoffTime: string; // e.g. "07:15"
  returnStartTime?: string; // e.g. "14:00"
  dailySchedules?: { [dayIndex: number]: WorkDaySchedule }; // Jadwal spesifik per hari kerja (Senin-Kamis, Jumat, Sabtu)
  enablePhotoCapture?: boolean; // Ambil foto bukti otomatis saat scan QR (default: true)
  autoCheckOutWithIn?: boolean; // Otomatis isi/centang absen pulang bersamaan saat absen pagi 1 kali (default: false/true)
  whatsappTargetPhone?: string; // Nomor WA tujuan kirim rekap harian (Kepsek / Grup)
  whatsappTargetName?: string; // Nama pemilik nomor tujuan (e.g. "Bapak Kepala Sekolah", "Grup Guru")
  schoolName: string;
  schoolAddress: string;
  academicYear: string;
  nss?: string; // Nomor Statistik Sekolah (e.g. "101180816027")
  npsn?: string; // NPSN (e.g. "40206214")
  jumlahKS?: number;
  jumlahGuru?: number;
  jumlahTU?: number;
  headmasterName?: string;
  headmasterNip?: string;
  korwilName?: string;
  korwilNip?: string;
  korwilTitle?: string;
  korwilKecamatan?: string;
  signatureCity?: string;
  schoolCity?: string;
  schoolRegency?: string;
  schoolDepartment?: string;
  logoKabupatenUrl?: string;
  logoDinasUrl?: string;
  logoSekolahUrl?: string; // Logo Resmi Sekolah / Satuan Pendidikan
  headmasterSignatureUrl?: string; // Gambar Tanda Tangan / Stempel Resmi Kepala Sekolah
  headmasterSignatureType?: 'none' | 'qr_digital' | 'signature_stamp' | 'both'; // Mode Pengesahan: 'none' (Fokus Barcode Absen Penuh) vs QR Code TTD Digital vs TTD Basah/Stempel vs Keduanya
  cardTitle?: string;
  defaultCardTemplate?: CardTemplateId;
  cardValidityText?: string;
  announcementTitle?: string;
  announcementContent?: string;
  announcementVersion?: string;
  announcementDate?: string;
  announcementActive?: boolean;
  firestoreDatabaseId?: string;
  customHolidays?: { [dateStr: string]: string }; // e.g. { '2026-09-01': 'Libur Semester' }
}

export interface QRPayload {
  app: string;
  nip?: string;
  nis?: string;
  name: string;
  position?: string;
  classRoom?: string;
}

export type ActiveTab = 'rekap_dinas' | 'dashboard' | 'scanner' | 'students' | 'simulator' | 'leaves';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export const SUPER_ADMIN_EMAIL = 'fadli46046@gmail.com';

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

export type TeacherType = 'admin' | 'wali_kelas' | 'guru_mapel' | 'kepala_sekolah';

export interface Teacher {
  id: string;
  schoolId?: string;
  name: string;
  email: string;
  pin?: string;
  nip?: string;
  subject: string;
  role: 'admin' | 'guru';
  teacherType: TeacherType;
  homeroomClass?: string;
}

export type LeaveType = 'Izin' | 'Sakit' | 'Dinas Luar' | 'Cuti Tahunan' | 'Cuti Alasan Penting' | 'Dispensasi';

export interface ScheduledLeave {
  id: string;
  schoolId?: string;
  guruId?: string;
  studentId?: string;
  teacherId?: string;
  nip?: string;
  nis?: string;
  guruName?: string;
  studentName?: string;
  position?: string;
  classRoom?: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  attachmentPhoto?: string; // Surat tugas atau surat dokter
  createdAt: string;
  recordedBy?: string;
  status: 'Disetujui' | 'Menunggu' | 'Selesai' | 'Dibatalkan' | 'Aktif';
}

export type IzinGuru = ScheduledLeave;

export type BehaviorType = 'positive' | 'negative' | 'neutral';

export interface BehaviorLog {
  id: string;
  schoolId?: string;
  studentId: string;
  nis: string;
  studentName: string;
  classRoom: string;
  date: string;
  type: BehaviorType;
  category: string;
  title: string;
  points: number;
  description: string;
  recordedBy: string;
  createdAt: string;
}

export interface ERaporKehadiran {
  sakit: number;
  izin: number;
  tanpaKeterangan: number;
}

export interface ERaporRecapDoc {
  nisn: string;
  namaSiswa: string;
  kelas: string;
  semester: number;
  tahunAjaran: string;
  sakit: number;
  izin: number;
  tanpaKeterangan: number;
  kehadiran: ERaporKehadiran;
  updatedAt: string;
  schoolId?: string;
  tipePeriode?: 'semester' | 'bulanan' | 'rentang_tanggal';
  periodeLabel?: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  bulan?: string;
}
