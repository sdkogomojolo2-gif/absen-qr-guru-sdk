import { Guru } from '../types';

/**
 * Returns numerical priority rank for employment status:
 * 1: PNS (Pegawai Negeri Sipil)
 * 2: P3K / PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)
 * 3: Honorer / GTT / PTT / Non PNS
 */
export const getEmploymentStatusRank = (status?: string): number => {
  const s = (status || '').toUpperCase().trim();
  if (s.includes('PNS') && !s.includes('NON') && !s.includes('P3K') && !s.includes('PPPK')) {
    return 1;
  }
  if (s.includes('P3K') || s.includes('PPPK')) {
    return 2;
  }
  return 3; // Honorer, GTT, PTT, Tenaga Kependidikan Honorer
};

/**
 * Normalizes employment status to canonical group: 'PNS' | 'P3K' | 'Honorer'
 */
export const getCanonicalStatusGroup = (status?: string): 'PNS' | 'P3K' | 'Honorer' => {
  const rank = getEmploymentStatusRank(status);
  if (rank === 1) return 'PNS';
  if (rank === 2) return 'P3K';
  return 'Honorer';
};

/**
 * Sorts teachers strictly by:
 * 1. Employment Status: PNS first -> P3K second -> Honorer third
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
    if (statusFilter === 'Honorer' || statusFilter.toLowerCase().includes('gtt')) return group === 'Honorer';

    return t.employmentStatus === statusFilter;
  });
};
