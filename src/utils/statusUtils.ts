import { Guru, EmploymentStatus } from '../types';

export const EMPLOYMENT_STATUS_OPTIONS: EmploymentStatus[] = [
  'PNS',
  'P3K',
  'Honor K-2',
  'Honorer Sekolah',
];

/**
 * Standard PNS Golongan / Pangkat Options
 */
export const PNS_RANK_OPTIONS: string[] = [
  'Penata Muda (III/a)',
  'Penata Muda Tkt. I (III/b)',
  'Penata (III/c)',
  'Penata Tkt. I (III/d)',
  'Pembina (IV/a)',
  'Pembina Tkt. I (IV/b)',
  'Pembina Utama Muda (IV/c)',
  'Pembina Utama Madya (IV/d)',
  'Pembina Utama (IV/e)',
  'Pengatur Muda (II/a)',
  'Pengatur Muda Tkt. I (II/b)',
  'Pengatur (II/c)',
  'Pengatur Tkt. I (II/d)',
];

/**
 * Standard P3K / PPPK Golongan Options
 */
export const P3K_RANK_OPTIONS: string[] = [
  'Golongan IX (Ahli Pertama)',
  'Golongan X (Ahli Muda)',
  'Golongan XI (Ahli Madya)',
  'Golongan VII (Terampil)',
  'Golongan VIII',
  'Golongan V',
  'Golongan I',
  'Golongan II',
  'Golongan III',
  'Golongan IV',
  'Golongan VI',
  'Golongan XII',
];

/**
 * Common distance suggestions (Meters)
 */
export const COMMON_SCHOOL_DISTANCES: string[] = [
  '500 M',
  '1.000 M',
  '1.500 M',
  '2.000 M',
  '3.000 M',
  '4.000 M',
  '5.000 M',
  '10.000 M',
];

/**
 * Returns numerical priority rank for employment status:
 * 1: PNS (Pegawai Negeri Sipil)
 * 2: P3K / PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)
 * 3: Honor K-2
 * 4: Honorer Sekolah / GTT / PTT
 */
export const getEmploymentStatusRank = (status?: string): number => {
  const s = (status || '').toUpperCase().trim();
  if (s.includes('PNS') && !s.includes('NON') && !s.includes('P3K') && !s.includes('PPPK')) {
    return 1;
  }
  if (s.includes('P3K') || s.includes('PPPK')) {
    return 2;
  }
  if (s.includes('K-2') || s.includes('K2') || s.includes('KATEGORI 2') || s.includes('KATEGORI-2')) {
    return 3;
  }
  return 4; // Honorer Sekolah, GTT, PTT, Tenaga Kependidikan Honorer
};

/**
 * Normalizes employment status to canonical group: 'PNS' | 'P3K' | 'Honor K-2' | 'Honorer Sekolah'
 */
export const getCanonicalStatusGroup = (status?: string): 'PNS' | 'P3K' | 'Honor K-2' | 'Honorer Sekolah' => {
  const rank = getEmploymentStatusRank(status);
  if (rank === 1) return 'PNS';
  if (rank === 2) return 'P3K';
  if (rank === 3) return 'Honor K-2';
  return 'Honorer Sekolah';
};

/**
 * Normalizes a raw string into one of standard options: 'PNS' | 'P3K' | 'Honor K-2' | 'Honorer Sekolah'
 */
export const normalizeEmploymentStatus = (status?: string): EmploymentStatus => {
  if (!status) return 'Honorer Sekolah';
  const s = status.toUpperCase().trim();
  if (s.includes('PNS') && !s.includes('NON') && !s.includes('P3K') && !s.includes('PPPK')) {
    return 'PNS';
  }
  if (s.includes('P3K') || s.includes('PPPK')) {
    return 'P3K';
  }
  if (s.includes('K-2') || s.includes('K2') || s.includes('KATEGORI 2') || s.includes('KATEGORI-2')) {
    return 'Honor K-2';
  }
  return 'Honorer Sekolah';
};

/**
 * Sorts teachers strictly by:
 * 1. Employment Status: PNS first -> P3K second -> Honor K-2 third -> Honorer Sekolah fourth
 * 2. Position: Kepala Sekolah first within their status group
 * 3. Name: Alphabetical
 */
export const sortTeachersByStatus = (teachers: Guru[]): Guru[] => {
  return [...teachers].sort((a, b) => {
    const rankA = getEmploymentStatusRank(a.employmentStatus);
    const rankB = getEmploymentStatusRank(b.employmentStatus);
    if (rankA !== rankB) return rankA - rankB;

    // Within same status group, Kepala Sekolah comes first
    const isHeadA =
      a.position?.toLowerCase().includes('kepala') ||
      a.name?.toLowerCase().includes('rahmat');
    const isHeadB =
      b.position?.toLowerCase().includes('kepala') ||
      b.name?.toLowerCase().includes('rahmat');
    if (isHeadA && !isHeadB) return -1;
    if (!isHeadA && isHeadB) return 1;

    // Then Guru before Tenaga Kependidikan/Penjaga
    const isTeacherA = !a.position?.toLowerCase().includes('penjaga') && !a.position?.toLowerCase().includes('keamanan');
    const isTeacherB = !b.position?.toLowerCase().includes('penjaga') && !b.position?.toLowerCase().includes('keamanan');
    if (isTeacherA && !isTeacherB) return -1;
    if (!isTeacherA && isTeacherB) return 1;

    return a.name.localeCompare(b.name, 'id');
  });
};

/**
 * Filters and sorts teachers based on search query and status filter
 */
export const filterAndSortTeachers = (
  teachers: Guru[],
  searchTerm: string = '',
  statusFilter: string = 'Semua'
): Guru[] => {
  const sorted = sortTeachersByStatus(teachers);

  return sorted.filter((t) => {
    const matchSearch =
      !searchTerm ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.nip && t.nip.includes(searchTerm)) ||
      (t.nuptk && t.nuptk.includes(searchTerm)) ||
      (t.position && t.position.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (!statusFilter || statusFilter === 'Semua') return true;

    const group = getCanonicalStatusGroup(t.employmentStatus);
    if (statusFilter === 'PNS') return group === 'PNS';
    if (statusFilter === 'P3K' || statusFilter === 'PPPK') return group === 'P3K';
    if (statusFilter === 'Honor K-2' || statusFilter === 'K-2' || statusFilter === 'K2') return group === 'Honor K-2';
    if (statusFilter === 'Honorer Sekolah' || statusFilter === 'Honorer' || statusFilter.toLowerCase().includes('gtt')) return group === 'Honorer Sekolah';

    return t.employmentStatus === statusFilter;
  });
};
