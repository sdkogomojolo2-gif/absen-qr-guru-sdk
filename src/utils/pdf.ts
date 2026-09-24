import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, SystemSettings, Guru } from '../types';
import { formatCleanNIP, formatClassLabel } from './classUtils';

interface PDFReportOptions {
  records: AttendanceRecord[];
  dateRangeLabel: string;
  selectedClass: string;
  settings: SystemSettings;
  stats: {
    totalStudents: number;
    hadir: number;
    terlambat: number;
    izinSakit: number;
    alpa: number;
  };
  homeroomTeacher?: {
    name?: string;
    nip?: string;
    classLabel?: string;
  };
  headmaster?: {
    name?: string;
    nip?: string;
  };
  signatureDate?: string;
}

export const generateAttendancePDFReport = ({
  records,
  dateRangeLabel,
  selectedClass,
  settings,
  stats,
  homeroomTeacher,
  headmaster,
  signatureDate,
}: PDFReportOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header / Kop Surat
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `LAPORAN REKAPITULASI PRESENSI GURU - TAHUN AJARAN ${settings.academicYear}`,
    pageWidth / 2,
    16,
    { align: 'center' }
  );

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  let startY = 32;
  doc.text(`Periode Laporan: ${dateRangeLabel}`, 14, startY);
  doc.text(`Kelas Filter: ${selectedClass}`, 14, startY + 5);
  doc.text(`Jam Batas Masuk: ${settings.lateCutoffTime} WIB`, 14, startY + 10);

  // Stats Box on the right
  const rightX = pageWidth - 14;
  doc.setFontSize(9);
  doc.text(
    `Hadir: ${stats.hadir} | Terlambat: ${stats.terlambat} | Izin/Sakit: ${stats.izinSakit} | Alpa: ${stats.alpa}`,
    rightX,
    startY,
    { align: 'right' }
  );
  doc.text(
    `Total Entri Terdata: ${records.length} Record`,
    rightX,
    startY + 5,
    { align: 'right' }
  );

  // Divider Line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, startY + 14, pageWidth - 14, startY + 14);

  // Determine if multi-day report
  const uniqueDates = new Set(records.map((r) => r.date));
  const isMultiDay = uniqueDates.size > 1;

  // Table Columns & Rows
  let tableHeaders: string[][];
  let tableRows: (string | number)[][];

  if (isMultiDay) {
    tableHeaders = [['No', 'Tgl', 'Jam', 'NIP/ID', 'Nama Guru', 'Jabatan', 'Status', 'Metode', 'Keterangan']];
    tableRows = records.map((rec, index) => [
      index + 1,
      rec.date,
      rec.time,
      rec.nis,
      rec.studentName,
      rec.classRoom,
      rec.status,
      rec.scannedVia,
      rec.note || '-',
    ]);
  } else {
    tableHeaders = [['No', 'Jam', 'NIP/ID', 'Nama Guru', 'Jabatan', 'Status', 'Metode', 'Keterangan']];
    tableRows = records.map((rec, index) => [
      index + 1,
      rec.time,
      rec.nis,
      rec.studentName,
      rec.classRoom,
      rec.status,
      rec.scannedVia,
      rec.note || '-',
    ]);
  }

  autoTable(doc, {
    startY: startY + 18,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: isMultiDay
      ? {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 42 },
          5: { cellWidth: 14, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' },
          7: { cellWidth: 18, halign: 'center' },
          8: { cellWidth: 'auto' },
        }
      : {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 50 },
          4: { cellWidth: 16, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
          7: { cellWidth: 'auto' },
        },
    didParseCell: function (data) {
      // Highlight Status column
      const statusColIndex = isMultiDay ? 6 : 5;
      if (data.section === 'body' && data.column.index === statusColIndex) {
        const val = String(data.cell.raw);
        if (val === 'Hadir') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Terlambat') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'Alpa') {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [79, 70, 229]; // Indigo
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Tanda Tangan / Signature Block at the end
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 120;

  // Check remaining page space for signatures (needs at least 45mm)
  let sigY = finalY + 12;
  if (sigY + 45 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    sigY = 22;
  }

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Date and location label (Right side above Kepala Sekolah)
  const now = new Date();
  const dateFormatted = signatureDate || now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const city = settings.schoolCity || 'Kota';
  const locationDateStr = `${city}, ${dateFormatted}`;

  // Left column: Wali Kelas masing-masing
  const leftX = 20;
  const cleanSelectedClass = formatClassLabel(selectedClass);
  const fallbackWali =
    selectedClass !== 'Semua'
      ? (/^guru\s+kelas\b/i.test(cleanSelectedClass)
          ? `Wali ${cleanSelectedClass.replace(/^guru\s*/i, '')}`
          : cleanSelectedClass)
      : 'Wali Kelas / Koordinator Presensi';
  const waliTitle = homeroomTeacher?.classLabel || fallbackWali;
  const waliName = homeroomTeacher?.name?.trim() || '( ........................................ )';
  const waliNip = formatCleanNIP(homeroomTeacher?.nip);

  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', leftX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(waliTitle, leftX, sigY + 10);

  // Underlined Wali Kelas Name & NIP
  doc.setFont('helvetica', 'bold');
  doc.text(waliName, leftX, sigY + 34);
  const waliTextWidth = Math.max(doc.getTextWidth(waliName), 50);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(leftX, sigY + 35, leftX + waliTextWidth, sigY + 35);

  doc.setFont('helvetica', 'normal');
  doc.text(waliNip, leftX, sigY + 40);

  // Right column: Kepala Sekolah
  const sigRightX = pageWidth - 80;
  const headName =
    headmaster?.name?.trim() || settings.headmasterName?.trim() || '( ........................................ )';
  const headNip = formatCleanNIP(headmaster?.nip || settings.headmasterNip);

  doc.setFont('helvetica', 'normal');
  doc.text(locationDateStr, sigRightX, sigY);
  doc.text('Mengetahui,', sigRightX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', sigRightX, sigY + 10);

  // Underlined Headmaster Name & NIP
  doc.setFont('helvetica', 'bold');
  doc.text(headName, sigRightX, sigY + 34);
  const headTextWidth = Math.max(doc.getTextWidth(headName), 50);
  doc.line(sigRightX, sigY + 35, sigRightX + headTextWidth, sigY + 35);

  doc.setFont('helvetica', 'normal');
  doc.text(headNip, sigRightX, sigY + 40);

  // Save the PDF
  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeRange = dateRangeLabel.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const filename = `Laporan_Presensi_${safeSchool}_${safeRange}_Kelas_${safeClass}.pdf`;
  doc.save(filename);
};

export interface MonthlyStudentRecapItem {
  nis: string;
  name: string;
  classRoom: string;
  gender: string;
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalHadir: number;
  percentage: number;
}

export interface MonthlyPDFReportOptions {
  recaps: MonthlyStudentRecapItem[];
  monthLabel: string;
  selectedClass: string;
  settings: SystemSettings;
  homeroomTeacher?: {
    name?: string;
    nip?: string;
    classLabel?: string;
  };
  headmaster?: {
    name?: string;
    nip?: string;
  };
  signatureDate?: string;
}

/**
 * Generate Monthly Student Attendance Summary PDF Report
 * Columns: No, NIS, Nama Siswa, Kelas, L/P, Hadir (H), Terlambat (T), Sakit (S), Izin (I), Alfa (A), Total Kehadiran, % Hadir
 */
export const generateMonthlyAttendancePDFReport = ({
  recaps,
  monthLabel,
  selectedClass,
  settings,
  homeroomTeacher,
  headmaster,
  signatureDate,
}: MonthlyPDFReportOptions) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header / Kop Surat
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 9, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `LAPORAN REKAPITULASI PRESENSI BULANAN GURU - TAHUN AJARAN ${settings.academicYear}`,
    pageWidth / 2,
    15,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    settings.schoolAddress || 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia',
    pageWidth / 2,
    20,
    { align: 'center' }
  );

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');

  const startY = 30;
  doc.text(`Bulan / Periode : ${monthLabel}`, 14, startY);
  doc.text(`Jabatan / Unit : ${selectedClass === 'Semua' ? 'Semua Tenaga Pendidik' : selectedClass}`, 14, startY + 5);
  doc.text(`Total Guru : ${recaps.length} Orang`, 14, startY + 10);

  // Totals calculations
  const totalHadir = recaps.reduce((sum, r) => sum + r.hadir, 0);
  const totalTerlambat = recaps.reduce((sum, r) => sum + r.terlambat, 0);
  const totalSakit = recaps.reduce((sum, r) => sum + r.sakit, 0);
  const totalIzin = recaps.reduce((sum, r) => sum + r.izin, 0);
  const totalAlpa = recaps.reduce((sum, r) => sum + r.alpa, 0);

  const rightX = pageWidth - 14;
  doc.setFontSize(9);
  doc.text(
    `Akumulasi Kelas: Hadir: ${totalHadir} | Terlambat: ${totalTerlambat} | Sakit: ${totalSakit} | Izin: ${totalIzin} | Alfa: ${totalAlpa}`,
    rightX,
    startY + 5,
    { align: 'right' }
  );

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, startY + 13, pageWidth - 14, startY + 13);

  // Table Headers
  const tableHeaders = [
    [
      'No',
      'NIP/ID',
      'Nama Lengkap Guru',
      'Jabatan/Unit',
      'L/P',
      'Hadir (H)',
      'Terlambat (T)',
      'Sakit (S)',
      'Izin (I)',
      'Alfa (A)',
      'Total Hadir',
      '% Kehadiran',
    ],
  ];

  const tableRows: (string | number)[][] = recaps.map((r, index) => [
    index + 1,
    r.nis,
    r.name,
    r.classRoom,
    r.gender === 'Perempuan' ? 'P' : 'L',
    `${r.hadir} hr`,
    `${r.terlambat} hr`,
    `${r.sakit} hr`,
    `${r.izin} hr`,
    `${r.alpa} hr`,
    `${r.totalHadir} hr`,
    `${r.percentage}%`,
  ]);

  // Append Total Row
  tableRows.push([
    '',
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    `${totalHadir} hr`,
    `${totalTerlambat} hr`,
    `${totalSakit} hr`,
    `${totalIzin} hr`,
    `${totalAlpa} hr`,
    `${totalHadir + totalTerlambat} hr`,
    '-',
  ]);

  autoTable(doc, {
    startY: startY + 16,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 65 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 24, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' },
      10: { cellWidth: 24, halign: 'center' },
      11: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data) => {
      // Style total row
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.textColor = [15, 23, 42];
      }

      // Column highlights for body (except last total row)
      if (data.section === 'body' && data.row.index < tableRows.length - 1) {
        if (data.column.index === 5) {
          data.cell.styles.textColor = [16, 185, 129]; // green
          data.cell.styles.fontStyle = 'bold';
        } else if (data.column.index === 6) {
          data.cell.styles.textColor = [217, 119, 6]; // amber
        } else if (data.column.index === 7 || data.column.index === 8) {
          data.cell.styles.textColor = [79, 70, 229]; // indigo
        } else if (data.column.index === 9) {
          data.cell.styles.textColor = [225, 29, 72]; // red
          data.cell.styles.fontStyle = 'bold';
        } else if (data.column.index === 10) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : startY + 50;
  const pageHeight = doc.internal.pageSize.getHeight();

  let sigY = finalY + 10;
  if (sigY + 45 > pageHeight) {
    doc.addPage();
    sigY = 20;
  }

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const now = new Date();
  const dateFormatted = signatureDate || now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const city = settings.schoolCity || 'Kota';
  const locationDateStr = `${city}, ${dateFormatted}`;

  // Left column: Wali Kelas
  const leftX = 25;
  const cleanSelectedClass2 = formatClassLabel(selectedClass);
  const fallbackWali2 =
    selectedClass !== 'Semua'
      ? (/^guru\s+kelas\b/i.test(cleanSelectedClass2)
          ? `Wali ${cleanSelectedClass2.replace(/^guru\s*/i, '')}`
          : cleanSelectedClass2)
      : 'Wali Kelas / Koordinator Presensi';
  const waliTitle = homeroomTeacher?.classLabel || fallbackWali2;
  const waliName = homeroomTeacher?.name?.trim() || '( ........................................ )';
  const waliNip = formatCleanNIP(homeroomTeacher?.nip);

  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', leftX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(waliTitle, leftX, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(waliName, leftX, sigY + 30);
  const waliTextWidth = Math.max(doc.getTextWidth(waliName), 50);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.line(leftX, sigY + 31, leftX + waliTextWidth, sigY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text(waliNip, leftX, sigY + 36);

  // Right column: Kepala Sekolah
  const sigRightX = pageWidth - 90;
  const headName =
    headmaster?.name?.trim() || settings.headmasterName?.trim() || '( ........................................ )';
  const headNip = formatCleanNIP(headmaster?.nip || settings.headmasterNip);

  doc.setFont('helvetica', 'normal');
  doc.text(locationDateStr, sigRightX, sigY);
  doc.text('Mengetahui,', sigRightX, sigY + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', sigRightX, sigY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text(headName, sigRightX, sigY + 30);
  const headTextWidth = Math.max(doc.getTextWidth(headName), 50);
  doc.line(sigRightX, sigY + 31, sigRightX + headTextWidth, sigY + 31);

  doc.setFont('helvetica', 'normal');
  doc.text(headNip, sigRightX, sigY + 36);

  const safeSchool = settings.schoolName.replace(/[\s\/\\]+/g, '_');
  const safeMonth = monthLabel.replace(/[\s\/\\]+/g, '_');
  const safeClass = selectedClass.replace(/[\s\/\\]+/g, '_');
  const filename = `Rekapitulasi_Bulanan_${safeSchool}_${safeMonth}_Kelas_${safeClass}.pdf`;
  doc.save(filename);
};

export interface ExportOfficialMonthlyRecapPDFParams {
  settings: SystemSettings;
  teachers: Guru[];
  attendanceRecords: AttendanceRecord[];
  selectedMonth: string; // e.g. '2026-09'
  monthLabel: string; // e.g. 'September 2026'
  daysInfo: Array<{
    dateStr: string;
    dayNumber: number;
    dayName: string;
    isSunday: boolean;
    isHoliday: boolean;
    holidayName?: string;
  }>;
  schoolAddress: string;
  nss: string;
  npsn: string;
  countKS: number;
  countGuru: number;
  countTU: number;
  statusFilter?: string;
  signatureDate?: string;
}

/**
 * Helper to format time (e.g. '07:15:00' -> '7.15')
 */
const formatPdfTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (clean.includes(':')) {
    const [h, m] = clean.split(':');
    const hourInt = parseInt(h, 10);
    return `${hourInt}.${m}`;
  }
  return clean;
};

/**
 * Exports Official Monthly Teacher/PTK Attendance Sheet PDF in Landscape A4
 * Contains Official Kop Dinas Kab. Parigi Moutong, Tut Wuri Handayani,
 * Teachers sorted by PNS -> P3K -> Honorer, Red Sundays & Holidays,
 * and Dual Signatures (Korwil & Kepala Sekolah).
 */
export const exportOfficialMonthlyRecapPDF = ({
  settings,
  teachers,
  attendanceRecords,
  selectedMonth,
  monthLabel,
  daysInfo,
  schoolAddress,
  nss,
  npsn,
  countKS,
  countGuru,
  countTU,
  statusFilter = 'Semua',
  signatureDate,
}: ExportOfficialMonthlyRecapPDFParams) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

  // --- 1. OFFICIAL KOP SURAT ---
  // Left Crest: Lambang Kabupaten Parigi Moutong (Stylized Heraldic Shield)
  const drawParigiBadge = (x: number, y: number) => {
    doc.saveGraphicsState();
    // Golden shield border
    doc.setFillColor(234, 179, 8); // Gold #eab308
    doc.roundedRect(x, y, 15, 16, 2, 2, 'F');
    // Inner blue shield
    doc.setFillColor(30, 58, 138); // Blue #1e3a8a
    doc.roundedRect(x + 0.8, y + 0.8, 13.4, 14.4, 1.5, 1.5, 'F');
    // Golden Star at top
    doc.setFillColor(250, 204, 21);
    doc.circle(x + 7.5, y + 4.2, 1.1, 'F');
    // Mountain / Green Triangle
    doc.setFillColor(4, 120, 87);
    doc.triangle(x + 7.5, y + 5.8, x + 12.5, y + 10.5, x + 2.5, y + 10.5, 'F');
    // Sea / Cyan Waves
    doc.setFillColor(56, 189, 248);
    doc.rect(x + 2.5, y + 10.5, 10, 2.2, 'F');
    // Label text
    doc.setFontSize(3.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PARIGI', x + 7.5, y + 14.5, { align: 'center' });
    doc.restoreGraphicsState();
  };

  // Right Crest: Tut Wuri Handayani Badge
  const drawTutWuriBadge = (x: number, y: number) => {
    doc.saveGraphicsState();
    // Pentagon shield
    doc.setFillColor(30, 58, 138); // Deep Navy
    doc.roundedRect(x, y, 15, 16, 2, 2, 'F');
    // Golden border
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.6);
    doc.roundedRect(x + 0.5, y + 0.5, 14, 15, 1.8, 1.8, 'S');
    // Golden flame torch
    doc.setFillColor(250, 204, 21);
    doc.circle(x + 7.5, y + 5, 1.6, 'F');
    // Wings
    doc.setFillColor(217, 119, 6);
    doc.triangle(x + 7.5, y + 7, x + 12.5, y + 11.5, x + 2.5, y + 11.5, 'F');
    // Text TUT WURI
    doc.setFontSize(3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TUT WURI', x + 7.5, y + 14.5, { align: 'center' });
    doc.restoreGraphicsState();
  };

  // Draw emblems (Custom uploaded logos or official vector emblems)
  if (settings.logoKabupatenUrl) {
    try {
      const isJpg =
        settings.logoKabupatenUrl.includes('image/jpeg') ||
        settings.logoKabupatenUrl.includes('image/jpg');
      doc.addImage(
        settings.logoKabupatenUrl,
        isJpg ? 'JPEG' : 'PNG',
        11,
        6,
        16,
        16,
        undefined,
        'FAST'
      );
    } catch (err) {
      console.warn('Fallback to vector badge for Kabupaten logo:', err);
      drawParigiBadge(12, 6.5);
    }
  } else {
    drawParigiBadge(12, 6.5);
  }

  if (settings.logoDinasUrl) {
    try {
      const isJpg =
        settings.logoDinasUrl.includes('image/jpeg') ||
        settings.logoDinasUrl.includes('image/jpg');
      doc.addImage(
        settings.logoDinasUrl,
        isJpg ? 'JPEG' : 'PNG',
        pageWidth - 27,
        6,
        16,
        16,
        undefined,
        'FAST'
      );
    } catch (err) {
      console.warn('Fallback to vector badge for Dinas logo:', err);
      drawTutWuriBadge(pageWidth - 27, 6.5);
    }
  } else {
    drawTutWuriBadge(pageWidth - 27, 6.5);
  }

  // Official Kop Titles (Center)
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('DAFTAR KONTROL KEHADIRAN GURU / TATA USAHA DAN PENJAGA SEKOLAH', pageWidth / 2, 9.5, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  const deptName = settings.schoolDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const regencyName = (settings.schoolRegency || 'KAB.PARIGI MOUTONG').replace('PEMERINTAH ', '');
  doc.text(`DILINGKUNGAN ${deptName} ${regencyName}`, pageWidth / 2, 14.5, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  doc.text(`BULAN : ${monthLabel.toUpperCase()}`, pageWidth / 2, 19.5, {
    align: 'center',
  });

  // Indonesian Government Standard Double Line Separator
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(8, 23.5, pageWidth - 8, 23.5);
  doc.setLineWidth(0.25);
  doc.line(8, 24.3, pageWidth - 8, 24.3);

  // --- 2. SCHOOL METADATA GRID ---
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const metaStartY = 27.5;
  const leftX = 9;
  const rightX = 175;

  // Left metadata
  doc.setFont('helvetica', 'bold');
  doc.text('NAMA SEKOLAH', leftX, metaStartY);
  doc.text('NSS / NPSN', leftX, metaStartY + 3.8);
  doc.text('ALAMAT', leftX, metaStartY + 7.6);

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${settings.schoolName.toUpperCase()}`, leftX + 25, metaStartY);
  doc.text(`: ${nss} / ${npsn}`, leftX + 25, metaStartY + 3.8);
  doc.text(`: ${schoolAddress}`, leftX + 25, metaStartY + 7.6);

  // Right metadata
  doc.setFont('helvetica', 'bold');
  doc.text('JUMLAH KS', rightX, metaStartY);
  doc.text('JUMLAH GURU', rightX, metaStartY + 3.8);
  doc.text('JUMLAH TU / PENJAGA', rightX, metaStartY + 7.6);
  doc.text('FILTER STATUS', rightX, metaStartY + 11.4);

  const statusFilterText =
    statusFilter === 'Semua' ? 'SEMUA STATUS (PNS, P3K & HONORER)' : statusFilter.toUpperCase();

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${countKS} Orang`, rightX + 34, metaStartY);
  doc.text(`: ${countGuru} Orang`, rightX + 34, metaStartY + 3.8);
  doc.text(`: ${countTU} Orang`, rightX + 34, metaStartY + 7.6);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${statusFilterText}`, rightX + 34, metaStartY + 11.4);

  // --- 3. TABLE GENERATION ---
  // Table Headers
  const headRow1: any[] = [
    { content: 'NO', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'NAMA / NIP & BIODATA PTK', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    { content: 'KETERANGAN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
    {
      content: 'TANGGAL / PARAF & JAM',
      colSpan: daysInfo.length,
      styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' },
    },
    { content: 'KET', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
  ];

  const headRow2: any[] = daysInfo.map((d) => {
    const isRed = d.isSunday || d.isHoliday;
    return {
      content: String(d.dayNumber),
      styles: {
        halign: 'center',
        valign: 'middle',
        fillColor: isRed ? [220, 38, 38] : [241, 245, 249],
        textColor: isRed ? [255, 255, 255] : [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 6.5,
      },
    };
  });

  // Table Body Rows (4 subrows per teacher)
  const bodyRows: any[][] = [];

  teachers.forEach((t, tIdx) => {
    const biodata = `${t.name}\nNUPTK: ${t.nuptk || '-'}\nNIP: ${t.nip || '-'}\nGol: ${t.rankGrade || '-'}\nAlamat: ${t.address || '-'}\nJarak: ${t.schoolDistance || '3.000 M'}`;
    const ketStatus = t.employmentStatus || 'PNS';

    // Subrow 1: Paraf Masuk
    const r1: any[] = [
      {
        content: String(tIdx + 1),
        rowSpan: 4,
        styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 7 },
      },
      {
        content: biodata,
        rowSpan: 4,
        styles: { valign: 'top', fontSize: 5.8, cellPadding: 0.8, fontStyle: 'normal' },
      },
      {
        content: 'Paraf Masuk',
        styles: { fontSize: 5.8, fontStyle: 'bold', valign: 'middle' },
      },
    ];

    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) {
        r1.push({
          content: d.isSunday ? 'Minggu' : (d.holidayName || 'Libur'),
          rowSpan: 4,
          styles: {
            fillColor: [254, 226, 226],
            textColor: [185, 28, 28],
            halign: 'center',
            valign: 'middle',
            fontSize: 5,
            fontStyle: 'bold',
          },
        });
      } else {
        const rec = attendanceRecords.find(
          (r) =>
            (r.guruId === t.id ||
              r.studentId === t.id ||
              (r.nip && t.nip && r.nip === t.nip) ||
              (r.nis && t.nis && r.nis === t.nis)) &&
            r.date === d.dateStr
        );
        const symbol =
          rec?.status === 'Hadir' || rec?.status === 'Terlambat'
            ? 'v'
            : rec?.status === 'Dinas Luar'
            ? 'DL'
            : rec?.status === 'Izin'
            ? 'I'
            : rec?.status === 'Sakit'
            ? 'S'
            : rec?.status === 'Alpa'
            ? 'A'
            : '';
        r1.push({
          content: symbol,
          styles: { halign: 'center', valign: 'middle', fontSize: 6, fontStyle: 'bold' },
        });
      }
    });

    r1.push({
      content: ketStatus,
      rowSpan: 4,
      styles: { halign: 'center', valign: 'middle', fontSize: 6, fontStyle: 'bold' },
    });
    bodyRows.push(r1);

    // Subrow 2: Jam Masuk
    const r2: any[] = [
      {
        content: 'Jam',
        styles: { fontSize: 5.5, valign: 'middle', textColor: [71, 85, 105] },
      },
    ];
    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) return; // covered by rowSpan=4
      const rec = attendanceRecords.find(
        (r) =>
          (r.guruId === t.id ||
            r.studentId === t.id ||
            (r.nip && t.nip && r.nip === t.nip) ||
            (r.nis && t.nis && r.nis === t.nis)) &&
          r.date === d.dateStr
      );
      const timeVal = formatPdfTime(rec?.timeIn || rec?.time);
      r2.push({
        content: timeVal,
        styles: { halign: 'center', valign: 'middle', fontSize: 5 },
      });
    });
    bodyRows.push(r2);

    // Subrow 3: Paraf Keluar
    const r3: any[] = [
      {
        content: 'Paraf Keluar',
        styles: { fontSize: 5.5, valign: 'middle' },
      },
    ];
    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) return; // covered by rowSpan=4
      const rec = attendanceRecords.find(
        (r) =>
          (r.guruId === t.id ||
            r.studentId === t.id ||
            (r.nip && t.nip && r.nip === t.nip) ||
            (r.nis && t.nis && r.nis === t.nis)) &&
          r.date === d.dateStr
      );
      const hasOut = rec?.timeOut || (rec && (rec.status === 'Hadir' || rec.status === 'Terlambat'));
      r3.push({
        content: hasOut ? 'v' : '',
        styles: { halign: 'center', valign: 'middle', fontSize: 6, fontStyle: 'bold' },
      });
    });
    bodyRows.push(r3);

    // Subrow 4: Jam Keluar
    const r4: any[] = [
      {
        content: 'Jam',
        styles: { fontSize: 5.5, valign: 'middle', textColor: [71, 85, 105] },
      },
    ];
    daysInfo.forEach((d) => {
      if (d.isSunday || d.isHoliday) return; // covered by rowSpan=4
      const rec = attendanceRecords.find(
        (r) =>
          (r.guruId === t.id ||
            r.studentId === t.id ||
            (r.nip && t.nip && r.nip === t.nip) ||
            (r.nis && t.nis && r.nis === t.nis)) &&
          r.date === d.dateStr
      );
      const outVal = rec?.timeOut || (rec?.status === 'Hadir' ? '12.00' : '');
      r4.push({
        content: formatPdfTime(outVal),
        styles: { halign: 'center', valign: 'middle', fontSize: 5 },
      });
    });
    bodyRows.push(r4);
  });

  // Calculate dynamic column widths to fit exactly 281mm width
  const colStyles: { [key: number]: any } = {
    0: { cellWidth: 7 }, // NO
    1: { cellWidth: 44 }, // NAMA / BIODATA
    2: { cellWidth: 16 }, // KETERANGAN
  };

  const dayColWidth = Math.min(6.4, 198 / daysInfo.length);
  for (let i = 0; i < daysInfo.length; i++) {
    colStyles[3 + i] = { cellWidth: dayColWidth, halign: 'center' };
  }
  colStyles[3 + daysInfo.length] = { cellWidth: 16, halign: 'center' }; // KET

  autoTable(doc, {
    startY: 42,
    head: [headRow1, headRow2],
    body: bodyRows,
    theme: 'grid',
    margin: { left: 8, right: 8 },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
    },
    bodyStyles: {
      fontSize: 5.8,
      textColor: [15, 23, 42],
      lineWidth: 0.15,
      lineColor: [203, 213, 225],
      cellPadding: 0.6,
    },
    columnStyles: colStyles,
  });

  // --- 4. SIGNATURES & KETERANGAN BLOCK ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 120;

  let sigY = finalY + 7;
  if (sigY + 38 > pageHeight) {
    doc.addPage();
    sigY = 15;
  }

  // Draw Left Box: Legend / Keterangan
  const legendX = 10;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(legendX, sigY, 56, 26, 1.5, 1.5, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('KETERANGAN :', legendX + 3, sigY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(51, 65, 85);
  doc.text('A   : ALPA (TANPA KETERANGAN)', legendX + 3, sigY + 8.5);
  doc.text('I    : IZIN', legendX + 3, sigY + 12);
  doc.text('S   : SAKIT', legendX + 3, sigY + 15.5);
  doc.text('C   : CUTI', legendX + 3, sigY + 19);
  doc.text('DL : DINAS LUAR / TUGAS', legendX + 3, sigY + 22.5);

  // Middle Column: Mengetahui, Koordinator Wilayah (Korwil)
  const korwilX = pageWidth / 2 - 25;
  const korwilTitle = settings.korwilTitle || 'Koordinator Wilayah Satuan Pendidikan';
  const korwilKecamatan = settings.korwilKecamatan || 'Kecamatan Palasa';
  const korwilName = settings.korwilName || 'Drs. AGUSTAN, M.A.P';
  const korwilNip = formatCleanNIP(settings.korwilNip || '19670807 199702 1 001');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text('Mengetahui,', korwilX + 25, sigY + 3, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(korwilTitle, korwilX + 25, sigY + 7, { align: 'center' });
  doc.text(korwilKecamatan, korwilX + 25, sigY + 10.5, { align: 'center' });

  // Korwil signature line & name
  doc.text(korwilName, korwilX + 25, sigY + 25, { align: 'center' });
  const korwilWidth = Math.max(doc.getTextWidth(korwilName), 42);
  doc.setLineWidth(0.3);
  doc.line(korwilX + 25 - korwilWidth / 2, sigY + 26, korwilX + 25 + korwilWidth / 2, sigY + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(korwilNip, korwilX + 25, sigY + 29.5, { align: 'center' });

  // Right Column: Kepala Sekolah
  const rightSigX = pageWidth - 65;
  const now = new Date();
  const dateFormatted =
    signatureDate ||
    now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const city = settings.signatureCity || settings.schoolCity || 'Palasa Lambori';
  const headName = settings.headmasterName || 'RAHMAT, S.Pd., M.Pd';
  const headNip = formatCleanNIP(settings.headmasterNip || '19851204 200903 1 002');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${city}, ${dateFormatted}`, rightSigX + 25, sigY + 3, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Sekolah', rightSigX + 25, sigY + 7, { align: 'center' });
  doc.text(settings.schoolName || 'SDN Kecil Ogomojolo', rightSigX + 25, sigY + 10.5, {
    align: 'center',
  });

  // Kepsek signature line & name
  doc.text(headName, rightSigX + 25, sigY + 25, { align: 'center' });
  const headWidth = Math.max(doc.getTextWidth(headName), 42);
  doc.line(rightSigX + 25 - headWidth / 2, sigY + 26, rightSigX + 25 + headWidth / 2, sigY + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(headNip, rightSigX + 25, sigY + 29.5, { align: 'center' });

  // Save PDF
  const safeSchool = (settings.schoolName || 'SDN_Kecil_Ogomojolo').replace(/[\s\/\\]+/g, '_');
  const safeMonth = selectedMonth.replace(/[\s\/\\]+/g, '_');
  const safeStatus = statusFilter.replace(/[\s\/\\]+/g, '_');
  const filename = `Rekap_Presensi_${safeStatus}_${safeMonth}_${safeSchool}.pdf`;
  doc.save(filename);
};

