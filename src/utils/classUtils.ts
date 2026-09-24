import { AttendanceRecord, Student, Teacher, TeacherType } from '../types';

/**
 * Utility functions for matching, filtering, and displaying SD school classes.
 * Handles both plain grade formats ('1', 'Kelas 1', '1-A', 'Kelas 1-A') seamlessly.
 */

export const STANDARD_SD_CLASSES = [
  'Guru Kelas 1',
  'Guru Kelas 2',
  'Guru Kelas 3',
  'Guru Kelas 4',
  'Guru Kelas 5',
  'Guru Kelas 6',
];

/**
 * Normalizes class strings for safe comparison
 * e.g. "Guru Kelas 1" -> "1", "Kelas 1" -> "1", "1" -> "1"
 */
export function normalizeClass(cls?: string): string {
  if (!cls) return '';
  return cls
    .trim()
    .toLowerCase()
    .replace(/^kelas\s+/i, '')
    .replace(/^guru\s*kelas\s*/i, '')
    .replace(/^kelas\s*/i, '')
    .replace(/\s+/g, '');
}

/**
 * Checks if a student's class matches the teacher's homeroom class.
 * Matches:
 * - "Guru Kelas 1" === "Kelas 1" === "1"
 * - "Guru Kelas 1" matches student in "1", "Kelas 1", "1-A", "1-B" (if homeroom is general grade 1)
 */
export function isHomeroomClassMatch(studentClass?: string, homeroomClass?: string): boolean {
  if (!studentClass || !homeroomClass) return false;
  if (homeroomClass === 'Semua') return true;

  const stdClean = normalizeClass(studentClass);
  const hrClean = normalizeClass(homeroomClass);

  // Exact match
  if (stdClean === hrClean) return true;

  // If homeroom is general single-digit grade (1 to 6)
  if (['1', '2', '3', '4', '5', '6'].includes(hrClean)) {
    if (stdClean === hrClean) return true;
    if (stdClean.startsWith(`${hrClean}-`) || stdClean.startsWith(`${hrClean}_`)) return true;
  }

  if (studentClass.toLowerCase().trim() === homeroomClass.toLowerCase().trim()) return true;

  return false;
}

/**
 * Formats a clean display label for a class / jabatan guru.
 * User requirement: "kata kelas dihapus saja, cukup guru kelas 1, guru kelas 2, kepala sekolah dll tidak perlu pakai kelas lagi"
 * Examples:
 * - "Kelas Guru Bahasa Inggris" -> "Guru Bahasa Inggris"
 * - "Kelas Guru Kelas 1" -> "Guru Kelas 1"
 * - "Kelas Kepala Sekolah" -> "Kepala Sekolah"
 * - "Kelas Operator Sekolah / Dapodik" -> "Operator Sekolah / Dapodik"
 * - "Kelas 1" -> "Guru Kelas 1"
 * - "1" -> "Guru Kelas 1"
 */
export function formatClassLabel(className?: string): string {
  if (!className) return '-';
  let str = className.trim();

  // Strip redundant leading "Kelas " if followed by "Guru ..." (e.g. "Kelas Guru Kelas 1" -> "Guru Kelas 1")
  if (/^kelas\s+guru\b/i.test(str)) {
    return str.replace(/^kelas\s+/i, '');
  }

  // Strip redundant leading "Kelas " if followed by non-class roles (Kepala Sekolah, Operator, Tenaga, Pengelola, TU, dll.)
  if (/^kelas\s+(kepala\s+sekolah|operator|tenaga|pengelola|tata\s+usaha|tu|penjaga|satpam|administrasi|dewan\s+guru|pegawai|staf|staff|ptk)/i.test(str)) {
    return str.replace(/^kelas\s+/i, '');
  }

  // If it's "Kelas 1", "Kelas 2", etc. -> convert to "Guru Kelas 1", "Guru Kelas 2", etc.
  const gradeMatch = str.match(/^kelas\s*([1-6](?:[-_\s][a-z0-9]+)?)$/i);
  if (gradeMatch) {
    return `Guru Kelas ${gradeMatch[1].toUpperCase()}`;
  }

  // If it's a plain number "1" to "6" -> convert to "Guru Kelas 1", etc.
  if (/^[1-6]$/.test(str)) {
    return `Guru Kelas ${str}`;
  }

  // If it starts with "Kelas " followed by any other text, strip "Kelas "
  if (/^kelas\s+/i.test(str)) {
    return str.replace(/^kelas\s+/i, '');
  }

  return str;
}

/**
 * Normalizes NIP string preventing duplicate "NIP. NIP." prefixes
 */
export function formatCleanNIP(rawNip?: string): string {
  if (!rawNip) return 'NIP. ............................';
  const trimmed = rawNip.trim();
  if (!trimmed || trimmed === '-' || trimmed.includes('.....')) {
    return 'NIP. ............................';
  }
  const cleaned = trimmed.replace(/^(?:NIP[\s.:-]+)+/i, '').trim();
  if (!cleaned || cleaned === '-' || cleaned.includes('.....')) {
    return 'NIP. ............................';
  }
  return `NIP. ${cleaned}`;
}

/**
 * Helper to produce clean homeroom title (e.g. "Wali Kelas 1" or "Kepala Sekolah")
 */
function getHomeroomLabel(targetClass: string): string {
  const clean = formatClassLabel(targetClass);
  if (/^guru\s+kelas\b/i.test(clean)) {
    return `Wali ${clean.replace(/^guru\s*/i, '')}`;
  }
  if (/^kepala\s+sekolah/i.test(clean)) {
    return 'Kepala Sekolah';
  }
  return clean;
}

/**
 * Finds the corresponding homeroom teacher for a class from the teachers list or active session
 */
export function findHomeroomTeacher(
  teachers: Teacher[] | undefined,
  targetClass: string,
  currentTeacher?: Teacher | null
): { name: string; nip: string; classLabel: string; isFound: boolean } {
  const isAll = !targetClass || targetClass === 'Semua';

  if (isAll) {
    if (currentTeacher?.homeroomClass) {
      return {
        name: currentTeacher.name,
        nip: formatCleanNIP(currentTeacher.nip),
        classLabel: getHomeroomLabel(currentTeacher.homeroomClass),
        isFound: true,
      };
    }
    const adminOrCoord = teachers?.find((t) => t.role === 'admin' || t.teacherType === 'admin');
    if (adminOrCoord) {
      return {
        name: adminOrCoord.name,
        nip: formatCleanNIP(adminOrCoord.nip),
        classLabel: 'Koordinator Presensi / Kesiswaan',
        isFound: true,
      };
    }
    return {
      name: '( ........................................ )',
      nip: 'NIP. ............................',
      classLabel: 'Wali Kelas / Koordinator Presensi',
      isFound: false,
    };
  }

  // Look for teacher assigned to this homeroom class
  const matchedTeacher = teachers?.find((t) => {
    if (!t.homeroomClass) return false;
    return isHomeroomClassMatch(targetClass, t.homeroomClass);
  });

  if (matchedTeacher) {
    return {
      name: matchedTeacher.name,
      nip: formatCleanNIP(matchedTeacher.nip),
      classLabel: getHomeroomLabel(targetClass),
      isFound: true,
    };
  }

  // Check current teacher
  if (currentTeacher?.homeroomClass && isHomeroomClassMatch(targetClass, currentTeacher.homeroomClass)) {
    return {
      name: currentTeacher.name,
      nip: formatCleanNIP(currentTeacher.nip),
      classLabel: getHomeroomLabel(targetClass),
      isFound: true,
    };
  }

  // Fallback placeholder
  return {
    name: '( ........................................ )',
    nip: 'NIP. ............................',
    classLabel: getHomeroomLabel(targetClass),
    isFound: false,
  };
}

/**
 * Resolves the actual teacher information for an attendance record.
 * Never returns generic placeholders like "Petugas Scanner" or "Petugas Sekolah".
 * Accurately recognizes and preserves Guru Mapel, Wali Kelas, and Admin.
 * When a Guru Mapel takes attendance, their name and subject are faithfully preserved.
 * Wali Kelas retains full recap of their class, whether taken by themselves, Guru Mapel, or Admin.
 */
export function resolveRecordTeacher(
  record: AttendanceRecord,
  teachersList: Teacher[] | undefined,
  studentsList: Student[] | undefined,
  activeTeacher?: Teacher | null
): { name: string; type: TeacherType; subject: string } {
  // 1. First: Check if record has a teacherId that matches a known teacher
  if (record.teacherId && teachersList) {
    const matchedById = teachersList.find((t) => t.id === record.teacherId);
    if (matchedById) {
      const type: TeacherType =
        matchedById.teacherType ||
        (matchedById.role === 'admin' ? 'admin' : matchedById.homeroomClass ? 'wali_kelas' : 'guru_mapel');
      return {
        name: matchedById.name,
        type,
        subject:
          type === 'kepala_sekolah'
            ? (matchedById.subject || 'Kepala Sekolah')
            : type === 'guru_mapel'
            ? (matchedById.subject ? `Mapel: ${matchedById.subject}` : 'Guru Mapel')
            : type === 'wali_kelas'
            ? (matchedById.homeroomClass ? `Wali ${formatClassLabel(matchedById.homeroomClass)}` : 'Wali Kelas')
            : (matchedById.subject || 'Admin Sekolah'),
      };
    }
  }

  // 2. If record already has a valid specific teacher name (not generic placeholder)
  const rawName = (record.teacherName || '').trim();
  const isGeneric =
    !rawName ||
    rawName.toLowerCase() === 'petugas scanner' ||
    rawName.toLowerCase() === 'petugas sekolah' ||
    rawName.toLowerCase() === 'wali kelas / sistem' ||
    rawName.toLowerCase() === 'sistem' ||
    rawName.toLowerCase() === 'petugas';

  if (!isGeneric) {
    // Check if teacherName matches a known teacher in teachersList
    const matchedByName = teachersList?.find(
      (t) => t.name.toLowerCase().trim() === rawName.toLowerCase().trim()
    );
    if (matchedByName) {
      const type: TeacherType =
        matchedByName.teacherType ||
        (matchedByName.role === 'admin' ? 'admin' : matchedByName.homeroomClass ? 'wali_kelas' : 'guru_mapel');
      return {
        name: matchedByName.name,
        type,
        subject:
          type === 'kepala_sekolah'
            ? (matchedByName.subject || 'Kepala Sekolah')
            : type === 'guru_mapel'
            ? (matchedByName.subject ? `Mapel: ${matchedByName.subject}` : 'Guru Mapel')
            : type === 'wali_kelas'
            ? (matchedByName.homeroomClass ? `Wali ${formatClassLabel(matchedByName.homeroomClass)}` : 'Wali Kelas')
            : (matchedByName.subject || 'Admin Sekolah'),
      };
    }

    // Check if record.teacherType was saved as guru_mapel
    if (record.teacherType === 'guru_mapel') {
      return {
        name: rawName,
        type: 'guru_mapel',
        subject: record.teacherSubject || 'Guru Mapel',
      };
    }

    if (record.teacherType === 'kepala_sekolah') {
      return {
        name: rawName,
        type: 'kepala_sekolah',
        subject: record.teacherSubject || 'Kepala Sekolah',
      };
    }

    if (record.teacherType === 'admin') {
      return {
        name: rawName,
        type: 'admin',
        subject: record.teacherSubject || 'Administrator Sekolah',
      };
    }

    const fallbackType: TeacherType =
      record.teacherType === 'admin' || record.teacherType === 'guru_mapel' || record.teacherType === 'kepala_sekolah'
        ? record.teacherType
        : 'wali_kelas';

    return {
      name: rawName,
      type: fallbackType,
      subject:
        record.teacherSubject ||
        (record.classRoom ? `Wali ${formatClassLabel(record.classRoom)}` : 'Wali Kelas'),
    };
  }

  // 3. Identify student's class
  const student = studentsList?.find((s) => s.id === record.studentId || s.nis === record.nis);
  const classRoom = record.classRoom || student?.classRoom || '';

  // 4. If currently active teacher is Guru Mapel and record was created during their active session
  if (activeTeacher && activeTeacher.teacherType === 'guru_mapel') {
    return {
      name: activeTeacher.name,
      type: 'guru_mapel',
      subject: activeTeacher.subject ? `Mapel: ${activeTeacher.subject}` : 'Guru Mapel',
    };
  }

  // 5. Find homeroom teacher matching this class
  const homeroom = teachersList?.find(
    (t) => t.homeroomClass && isHomeroomClassMatch(classRoom, t.homeroomClass)
  );

  if (homeroom) {
    return {
      name: homeroom.name,
      type: 'wali_kelas',
      subject: `Wali ${formatClassLabel(classRoom)}`,
    };
  }

  // 6. Check if active teacher is present
  if (activeTeacher?.name && activeTeacher.name.trim()) {
    const type: TeacherType =
      activeTeacher.teacherType || (activeTeacher.role === 'admin' ? 'admin' : activeTeacher.homeroomClass ? 'wali_kelas' : 'guru_mapel');
    return {
      name: activeTeacher.name,
      type,
      subject:
        type === 'kepala_sekolah'
          ? (activeTeacher.subject || 'Kepala Sekolah')
          : activeTeacher.homeroomClass
          ? `Wali ${formatClassLabel(activeTeacher.homeroomClass)}`
          : (activeTeacher.subject || (activeTeacher.role === 'admin' ? 'Admin Sekolah' : 'Guru Pengabsen')),
    };
  }

  // 7. Check if there is an Admin teacher in the teachers list
  const adminTeacher = teachersList?.find((t) => t.role === 'admin' || t.teacherType === 'admin');
  if (adminTeacher?.name) {
    return {
      name: adminTeacher.name,
      type: 'admin',
      subject: adminTeacher.subject || 'Admin Sekolah',
    };
  }

  // 8. First teacher in list
  if (teachersList && teachersList.length > 0 && teachersList[0].name) {
    const t0 = teachersList[0];
    const type: TeacherType =
      t0.teacherType || (t0.role === 'admin' ? 'admin' : t0.homeroomClass ? 'wali_kelas' : 'guru_mapel');
    return {
      name: t0.name,
      type,
      subject:
        type === 'kepala_sekolah'
          ? (t0.subject || 'Kepala Sekolah')
          : t0.subject || (t0.homeroomClass ? `Wali ${formatClassLabel(t0.homeroomClass)}` : 'Wali Kelas'),
    };
  }

  // 9. Ultimate fallback to school admin name (MOH. FADLI)
  return {
    name: 'MOH. FADLI',
    type: 'admin',
    subject: 'Administrator Sekolah',
  };
}
