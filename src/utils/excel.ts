import * as XLSX from 'xlsx';
import { Student } from '../types';
import { sortTeachersByStatus, normalizeEmploymentStatus } from './statusUtils';
import { resolveAttendanceEntryTime, resolveAttendanceReturnTime } from './scheduleUtils';

/**
 * Downloads a true Excel (.xlsx) template for bulk student import
 * Headers: NIS, Nama, Kelas, No HP Orang Tua
 */
export const downloadStudentImportTemplateExcel = (className: string = 'Guru 1') => {
  const templateData = [
    {
      'NIP / NUPTK': '198503152010011005',
      'Nama': 'Ahmad Fauzi, S.Pd.',
      'Jabatan / Tugas': className || 'Guru 1',
      'Jenis Karyawan': 'PNS',
      'Golongan / Pangkat': 'Penata Tkt. I (III/d)',
      'Jarak Rumah ke Sekolah': '3.000 M',
      'Jenis Kelamin': 'Laki-laki',
      'No HP Guru / WA': '081234567890',
      'Tempat Lahir': 'Paser',
      'Tanggal Lahir': '1985-05-12',
      'Alamat': 'Palasa',
    },
    {
      'NIP / NUPTK': '199007202014022003',
      'Nama': 'Anisa Rahmawati, S.Pd.SD',
      'Jabatan / Tugas': 'Guru PJOK',
      'Jenis Karyawan': 'P3K',
      'Golongan / Pangkat': 'Golongan IX (Ahli Pertama)',
      'Jarak Rumah ke Sekolah': '1.500 M',
      'Jenis Kelamin': 'Perempuan',
      'No HP Guru / WA': '081234567891',
      'Tempat Lahir': 'Tanah Grogot',
      'Tanggal Lahir': '1990-08-20',
      'Alamat': 'RT 01 Desa Ogomojolo',
    },
    {
      'NIP / NUPTK': '199208152021041003',
      'Nama': 'Hasan Basri, S.Pd.',
      'Jabatan / Tugas': 'Guru 2',
      'Jenis Karyawan': 'Honor K-2',
      'Golongan / Pangkat': '-',
      'Jarak Rumah ke Sekolah': '500 M',
      'Jenis Kelamin': 'Laki-laki',
      'No HP Guru / WA': '081234567893',
      'Tempat Lahir': 'Tolitoli',
      'Tanggal Lahir': '1992-08-15',
      'Alamat': 'RT 04 Desa Ogomojolo',
    },
    {
      'NIP / NUPTK': '199511042022031002',
      'Nama': 'Budi Santoso, S.Kom.',
      'Jabatan / Tugas': 'Tenaga Administrasi / Operator',
      'Jenis Karyawan': 'Honorer Sekolah',
      'Golongan / Pangkat': '-',
      'Jarak Rumah ke Sekolah': '2.000 M',
      'Jenis Kelamin': 'Laki-laki',
      'No HP Guru / WA': '081234567892',
      'Tempat Lahir': 'Paser',
      'Tanggal Lahir': '1995-11-04',
      'Alamat': 'RT 02 Desa Ogomojolo',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 22 }, // NIP / NUPTK
    { wch: 28 }, // Nama
    { wch: 28 }, // Jabatan
    { wch: 20 }, // Jenis Karyawan
    { wch: 24 }, // Golongan / Pangkat
    { wch: 24 }, // Jarak Rumah ke Sekolah
    { wch: 16 }, // Jenis Kelamin
    { wch: 18 }, // No HP Guru / WA
    { wch: 16 }, // Tempat Lahir
    { wch: 16 }, // Tanggal Lahir
    { wch: 30 }, // Alamat
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Guru');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Template_Import_Data_Guru_PTK.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Reads and parses an uploaded Excel file (.xls, .xlsx) and extracts student records.
 * Validates columns: NIS, Nama, Kelas, No HP Orang Tua
 */
export const parseStudentExcelFile = async (
  file: File,
  defaultClass: string,
  existingStudents: Student[]
): Promise<{ students: Student[]; errors: string[]; addedCount: number }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ students: [], errors: ['File Excel tidak memiliki lembar kerja (worksheet).'], addedCount: 0 });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Convert sheet to 2D array of raw values
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (!rows || rows.length < 2) {
          resolve({
            students: [],
            errors: ['File Excel kosong atau hanya memiliki baris judul/header.'],
            addedCount: 0,
          });
          return;
        }

        const headerRow = (rows[0] as any[]).map((col) => String(col).trim().toLowerCase());

        // Validate or map column positions
        let nisnIdx = headerRow.findIndex((c) => c.includes('nisn'));
        let nisIdx = headerRow.findIndex((c) => c.includes('nis') && !c.includes('nisn'));
        let nameIdx = headerRow.findIndex((c) => c.includes('nama'));
        let birthPlaceIdx = headerRow.findIndex((c) => c.includes('tempat') || c.includes('kota lahir'));
        let birthDateIdx = headerRow.findIndex(
          (c, idx) => idx !== birthPlaceIdx && (c.includes('tanggal') || c.includes('tgl lahir') || c.includes('tgl') || (c.includes('lahir') && !c.includes('tempat')))
        );
        let addressIdx = headerRow.findIndex((c) => c.includes('alamat') || c.includes('domisili') || c.includes('tinggal'));
        let statusIdx = headerRow.findIndex((c) => c.includes('status') || c.includes('karyawan') || c.includes('kepegawaian'));
        let rankIdx = headerRow.findIndex((c) => c.includes('gol') || c.includes('pangkat'));
        let distanceIdx = headerRow.findIndex((c) => c.includes('jarak') || c.includes('distance'));
        let classIdx = headerRow.findIndex((c) => c.includes('kelas') || c.includes('jabatan') || c.includes('tugas'));
        let genderIdx = headerRow.findIndex((c) => c.includes('kelamin') || c.includes('gender') || c.includes('jk'));
        let phoneIdx = headerRow.findIndex(
          (c) => c.includes('hp') || c.includes('phone') || c.includes('ortu') || c.includes('telepon') || c.includes('wa')
        );

        // Fallbacks if headers are missing or in default order: NIS (0), Nama (1), Kelas (2), No HP Ortu (3/4)
        if (nisIdx === -1) nisIdx = 0;
        if (nameIdx === -1) nameIdx = 1;
        if (classIdx === -1) classIdx = 2;
        if (genderIdx === -1) genderIdx = 3;
        if (phoneIdx === -1) phoneIdx = headerRow.length >= 5 ? 4 : 3;

        const MALE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
        const FEMALE_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

        const newStudents: Student[] = [];
        const errors: string[] = [];
        const existingNisSet = new Set(existingStudents.map((s) => s.nis.trim()));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as any[];
          if (!row || row.length === 0) continue;

          const rawNis = String(row[nisIdx] ?? '').trim();
          const rawNisn = nisnIdx !== -1 ? String(row[nisnIdx] ?? '').trim() : undefined;
          const rawName = String(row[nameIdx] ?? '').trim();
          const rawBirthPlace = birthPlaceIdx !== -1 ? String(row[birthPlaceIdx] ?? '').trim() : undefined;
          const rawBirthDate = birthDateIdx !== -1 ? String(row[birthDateIdx] ?? '').trim() : undefined;
          const rawAddress = addressIdx !== -1 ? String(row[addressIdx] ?? '').trim() : undefined;
          const rawClass = String(row[classIdx] ?? '').trim() || defaultClass || 'Guru 1';
          const rawStatus = statusIdx !== -1 ? String(row[statusIdx] ?? '').trim() : '';
          const rawRank = rankIdx !== -1 ? String(row[rankIdx] ?? '').trim() : undefined;
          const rawDistance = distanceIdx !== -1 ? String(row[distanceIdx] ?? '').trim() : undefined;
          let rawGender = String(row[genderIdx] ?? '').trim();
          const rawPhone = String(row[phoneIdx] ?? '').trim();

          // Skip completely empty rows
          if (!rawNis && !rawName) continue;

          if (!rawNis || !rawName) {
            errors.push(`Baris ${i + 1}: NIP/NUPTK dan Nama guru wajib diisi.`);
            continue;
          }

          if (existingNisSet.has(rawNis)) {
            errors.push(`Baris ${i + 1}: NIP/NUPTK "${rawNis}" (${rawName}) sudah ada di database, dilewati.`);
            continue;
          }

          const gLower = rawGender.toLowerCase();
          let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
          if (gLower.includes('p') || gLower.includes('female') || gLower.includes('wanita')) {
            gender = 'Perempuan';
          }

          const uniqueId = `std-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}`;
          const employmentStatus = normalizeEmploymentStatus(rawStatus);

          const newStudent: Student = {
            id: uniqueId,
            nip: rawNis,
            nuptk: rawNisn || undefined,
            nis: rawNis,
            nisn: rawNisn || undefined,
            name: rawName,
            birthPlace: rawBirthPlace || undefined,
            birthDate: rawBirthDate || undefined,
            address: rawAddress || undefined,
            classRoom: rawClass,
            position: rawClass,
            employmentStatus: employmentStatus,
            rankGrade: rawRank || undefined,
            schoolDistance: rawDistance || undefined,
            gender: gender,
            parentPhone: rawPhone,
            phone: rawPhone,
            avatarUrl: gender === 'Perempuan' ? FEMALE_AVATAR : MALE_AVATAR,
            createdAt: new Date().toISOString().split('T')[0],
          };

          existingNisSet.add(rawNis);
          newStudents.push(newStudent);
        }

        resolve({
          students: newStudents,
          errors,
          addedCount: newStudents.length,
        });
      } catch (err: any) {
        resolve({
          students: [],
          errors: ['Gagal membaca file Excel. Pastikan format file .xls atau .xlsx valid.'],
          addedCount: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        students: [],
        errors: ['Terjadi kesalahan saat membaca file dari komputer.'],
        addedCount: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Exports official monthly attendance sheet matching Indonesian School PTK format
 */
export interface ExportMonthlyRecapParams {
  settings: any;
  teachers: any[];
  attendanceRecords: any[];
  selectedMonth: string; // YYYY-MM
  daysInfo: any[];
  schoolAddress: string;
  nss: string;
  npsn: string;
  countKS: number;
  countGuru: number;
  countTU: number;
}

export const exportOfficialMonthlyRecapExcel = ({
  settings,
  teachers,
  attendanceRecords,
  selectedMonth,
  daysInfo,
  schoolAddress,
  nss,
  npsn,
  countKS,
  countGuru,
  countTU,
}: ExportMonthlyRecapParams) => {
  const wb = XLSX.utils.book_new();

  // Create table rows structure
  const rows: any[][] = [];

  // 1. Official Kop
  const deptName = settings.schoolDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const regencyName = (settings.schoolRegency || 'KAB.PARIGI MOUTONG').replace('PEMERINTAH ', '');

  rows.push(['DAFTAR KONTROL KEHADIRAN GURU / TATA USAHA DAN PENJAGA SEKOLAH']);
  rows.push([`DILINGKUNGAN ${deptName} ${regencyName}`]);
  rows.push([`BULAN : ${selectedMonth.toUpperCase()}`]);
  rows.push([]); // Empty row

  // 2. School Metadata
  rows.push(['NAMA SEKOLAH', `: ${(settings.schoolName || 'SDN Kecil Ogomojolo').toUpperCase()}`]);
  rows.push(['NSS / NPSN', `: ${nss} / ${npsn}`]);
  rows.push(['ALAMAT', `: ${schoolAddress}`]);
  rows.push(['JUMLAH KS', `: ${countKS} Orang`]);
  rows.push(['JUMLAH GURU', `: ${countGuru} Orang`]);
  rows.push(['JUMLAH TU / PENJAGA', `: ${countTU} Orang`]);
  rows.push([]); // Empty row

  // 3. Table Column Header Row 1
  const headerRow1 = ['NO', 'NAMA / NIP & BIODATA', 'KETERANGAN'];
  daysInfo.forEach((d) => {
    headerRow1.push(String(d.dayNumber));
  });
  headerRow1.push('KET');
  rows.push(headerRow1);

  // Table Column Header Row 2 (Day Names / Sunday Indicator)
  const headerRow2 = ['', '', 'HARI'];
  daysInfo.forEach((d) => {
    headerRow2.push(d.isSunday ? 'MINGGU' : d.isHoliday ? (d.holidayName || 'LIBUR') : d.dayName.slice(0, 3));
  });
  headerRow2.push('');
  rows.push(headerRow2);

  // 4. Sort teachers strictly by: PNS -> P3K -> Honorer
  const sortedTeachers = sortTeachersByStatus(teachers);

  // Body: 4 rows per teacher
  sortedTeachers.forEach((teacher, idx) => {
    const golStr = teacher.rankGrade && teacher.rankGrade.trim() ? teacher.rankGrade : '-';
    const jarakStr = teacher.schoolDistance && teacher.schoolDistance.trim() ? teacher.schoolDistance : '-';
    const biodata = `${teacher.name}\nNUPTK: ${teacher.nuptk || '-'}\nNIP: ${teacher.nip || '-'}\nPangkat/Gol: ${golStr}\nAlamat: ${teacher.address || '-'}\nJarak: ${jarakStr}`;
    const ket = teacher.employmentStatus || 'PNS';

    // Sub-row 1: Paraf Masuk
    const r1: any[] = [idx + 1, biodata, 'Paraf masuk'];
    daysInfo.forEach((d) => {
      if (d.isSunday) {
        r1.push('Minggu');
      } else if (d.isHoliday) {
        r1.push(d.holidayName || 'Libur');
      } else {
        const rec = attendanceRecords.find(
          (r) =>
            (r.guruId === teacher.id || r.studentId === teacher.id || (r.nip && teacher.nip && r.nip === teacher.nip)) &&
            r.date === d.dateStr
        );
        r1.push(rec ? (rec.status === 'Hadir' || rec.status === 'Terlambat' ? '✓' : rec.status) : '');
      }
    });
    r1.push(ket);
    rows.push(r1);

    // Sub-row 2: Jam Masuk
    const r2: any[] = ['', '', 'Jam'];
    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) {
        r2.push('');
      } else {
        const rec = attendanceRecords.find(
          (r) =>
            (r.guruId === teacher.id || r.studentId === teacher.id || (r.nip && teacher.nip && r.nip === teacher.nip)) &&
            r.date === d.dateStr
        );
        const entryTime = rec ? resolveAttendanceEntryTime(rec, settings) : '';
        r2.push(entryTime ? entryTime.replace(':', '.') : '');
      }
    });
    r2.push('');
    rows.push(r2);

    // Sub-row 3: Paraf Keluar
    const r3: any[] = ['', '', 'Paraf Keluar'];
    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) {
        r3.push('');
      } else {
        const rec = attendanceRecords.find(
          (r) =>
            (r.guruId === teacher.id || r.studentId === teacher.id || (r.nip && teacher.nip && r.nip === teacher.nip)) &&
            r.date === d.dateStr
        );
        r3.push(rec?.timeOut || (rec && (rec.status === 'Hadir' || rec.status === 'Terlambat')) ? '✓' : '');
      }
    });
    r3.push('');
    rows.push(r3);

    // Sub-row 4: Jam Keluar
    const r4: any[] = ['', '', 'Jam'];
    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) {
        r4.push('');
      } else {
        const rec = attendanceRecords.find(
          (r) =>
            (r.guruId === teacher.id || r.studentId === teacher.id || (r.nip && teacher.nip && r.nip === teacher.nip)) &&
            r.date === d.dateStr
        );
        const outTime = rec ? resolveAttendanceReturnTime(rec, settings) : '';
        r4.push(outTime ? outTime.replace(':', '.') : '');
      }
    });
    r4.push('');
    rows.push(r4);
  });

  // 5. Legend and Dual Signatures
  rows.push([]);
  rows.push(['KETERANGAN :', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['A = ALPA (TANPA KETERANGAN)']);
  rows.push(['I = IZIN']);
  rows.push(['S = SAKIT']);
  rows.push(['C = CUTI']);
  rows.push(['DL = DINAS LUAR / TUGAS']);
  rows.push([]);

  // Signature Block
  const city = settings.signatureCity || settings.schoolCity || 'Palasa Lambori';
  let todayFormatted = '';
  if (selectedMonth) {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      if (y && m) {
        const lastDay = new Date(y, m, 0);
        todayFormatted = lastDay.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
  }
  if (!todayFormatted) {
    todayFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  const korwilTitle = settings.korwilTitle || 'Koordinator Wilayah Satuan Pendidikan';
  const korwilKecamatan = settings.korwilKecamatan || 'Kecamatan Palasa';
  const korwilName = settings.korwilName || 'Drs. AGUSTAN, M.A.P';
  const korwilNip = settings.korwilNip || '19670807 199702 1 001';

  const headName = settings.headmasterName || 'RAHMAT, S.Pd., M.Pd';
  const headNip = settings.headmasterNip || '19851204 200903 1 002';

  // Middle & Right Signature headers
  const sigRow1: any[] = ['', '', '', '', '', '', 'Mengetahui,'];
  for (let i = 0; i < daysInfo.length - 12; i++) sigRow1.push('');
  sigRow1.push(`${city}, ${todayFormatted}`);
  rows.push(sigRow1);

  const sigRow2: any[] = ['', '', '', '', '', '', korwilTitle];
  for (let i = 0; i < daysInfo.length - 12; i++) sigRow2.push('');
  sigRow2.push('Kepala Sekolah');
  rows.push(sigRow2);

  const sigRow3: any[] = ['', '', '', '', '', '', korwilKecamatan];
  for (let i = 0; i < daysInfo.length - 12; i++) sigRow3.push('');
  sigRow3.push(settings.schoolName || 'SDN Kecil Ogomojolo');
  rows.push(sigRow3);

  rows.push([]); // blank lines for physical signature
  rows.push([]);
  rows.push([]);

  const sigRow4: any[] = ['', '', '', '', '', '', korwilName];
  for (let i = 0; i < daysInfo.length - 12; i++) sigRow4.push('');
  sigRow4.push(headName);
  rows.push(sigRow4);

  const sigRow5: any[] = ['', '', '', '', '', '', `NIP. ${korwilNip}`];
  for (let i = 0; i < daysInfo.length - 12; i++) sigRow5.push('');
  sigRow5.push(`NIP. ${headNip}`);
  rows.push(sigRow5);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  const colWidths: any[] = [{ wch: 6 }, { wch: 34 }, { wch: 14 }];
  daysInfo.forEach(() => {
    colWidths.push({ wch: 7 });
  });
  colWidths.push({ wch: 10 });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, `Rekap_${selectedMonth}`);

  const safeSchoolName = (settings.schoolName || 'SDK_OGOMOJOLO').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Rekap_Presensi_Guru_${selectedMonth}_${safeSchoolName}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
