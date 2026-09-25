import React, { useState, useMemo } from 'react';
import { Guru, AttendanceRecord, SystemSettings, Teacher } from '../types';
import { getMonthDaysInfo, DayInfo } from '../utils/holidayUtils';
import { RetroactiveAttendanceModal } from './RetroactiveAttendanceModal';
import { exportOfficialMonthlyRecapExcel } from '../utils/excel';
import { exportOfficialMonthlyRecapPDF } from '../utils/pdf';
import { filterAndSortTeachers } from '../utils/statusUtils';
import { OfficialReportKop } from './OfficialReportKop';
import { OfficialSignaturesBlock } from './OfficialSignaturesBlock';
import { LogoSettingsModal } from './LogoSettingsModal';
import { QuickBulkAttendanceModal } from './QuickBulkAttendanceModal';
import { resolveAttendanceEntryTime, resolveAttendanceReturnTime } from '../utils/scheduleUtils';

interface MonthlyRecapTabProps {
  teachers: Guru[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  currentTeacher?: Teacher | null;
  onSaveAttendanceRecord?: (record: AttendanceRecord) => void;
  onBulkSaveAttendanceRecords?: (records: AttendanceRecord[]) => Promise<void> | void;
  onUpdateSettings?: (settings: SystemSettings) => void;
  onOpenRetroactiveAttendance?: (date?: string, teacherId?: string) => void;
}

export const MonthlyRecapTab: React.FC<MonthlyRecapTabProps> = ({
  teachers,
  attendanceRecords,
  settings,
  currentTeacher,
  onSaveAttendanceRecord,
  onBulkSaveAttendanceRecords,
  onUpdateSettings,
  onOpenRetroactiveAttendance,
}) => {
  // Current month state in YYYY-MM format (e.g. '2026-09')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Semua');

  // Modal for Retroactive Attendance / Missed Attendance
  const [isRetroModalOpen, setIsRetroModalOpen] = useState<boolean>(false);
  const [retroTeacherId, setRetroTeacherId] = useState<string>('');
  const [retroDate, setRetroDate] = useState<string>('');
  const [retroExistingRecord, setRetroExistingRecord] = useState<AttendanceRecord | null>(null);

  // Modal for Managing Holidays / Tanggal Merah
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);
  const [holidayDate, setHolidayDate] = useState<string>('');
  const [holidayTitle, setHolidayTitle] = useState<string>('Libur Semester');

  // Modal for Managing Official Logos (Kabupaten & Dinas/Sekolah)
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);

  // Modal for Quick Bulk Attendance (Absen Cepat Guru & Tendik)
  const [isQuickBulkModalOpen, setIsQuickBulkModalOpen] = useState<boolean>(false);

  // Month days info
  const daysInfo: DayInfo[] = useMemo(() => {
    return getMonthDaysInfo(selectedMonth, settings.customHolidays);
  }, [selectedMonth, settings.customHolidays]);

  // Month Label in Indonesian e.g. "September 2026"
  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // School metadata calculations
  const schoolAddress = settings.schoolAddress || 'Jl. Kemiri, Dusun 5 Ogomojolo, Kecamatan Palasa';
  const nss = settings.nss || '101180816027';
  const npsn = settings.npsn || '40206214';

  const countKS = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.position?.toLowerCase().includes('kepala') ||
        t.name?.toLowerCase().includes('mulyadi') ||
        t.name?.toLowerCase().includes('rahmat')
    ).length || 1;
  }, [teachers]);

  const countTU = useMemo(() => {
    return teachers.filter(
      (t) =>
        t.position?.toLowerCase().includes('operator') ||
        t.position?.toLowerCase().includes('tu') ||
        t.position?.toLowerCase().includes('administrasi')
    ).length || 1;
  }, [teachers]);

  const countGuru = useMemo(() => {
    const total = teachers.length;
    const nonGuru = countKS + countTU;
    return total > nonGuru ? total - nonGuru : total;
  }, [teachers, countKS, countTU]);

  // Filtered and strictly sorted teachers (PNS -> P3K -> Honorer)
  const filteredTeachers = useMemo(() => {
    return filterAndSortTeachers(teachers, searchTerm, selectedStatusFilter);
  }, [teachers, searchTerm, selectedStatusFilter]);

  // Quick month navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 2, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10), 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  // Open Retroactive Attendance Modal for a specific teacher and date
  const handleCellClick = (teacher: Guru, day: DayInfo) => {
    const record = attendanceRecords.find(
      (r) =>
        (r.guruId === teacher.id ||
          r.studentId === teacher.id ||
          (r.nip && teacher.nip && r.nip === teacher.nip) ||
          (r.nis && teacher.nis && r.nis === teacher.nis)) &&
        r.date === day.dateStr
    );

    setRetroTeacherId(teacher.id);
    setRetroDate(day.dateStr);
    setRetroExistingRecord(record || null);
    setIsRetroModalOpen(true);
  };

  // Add / Save Holiday
  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayTitle) return;

    if (onUpdateSettings) {
      const updatedHolidays = {
        ...(settings.customHolidays || {}),
        [holidayDate]: holidayTitle,
      };
      onUpdateSettings({
        ...settings,
        customHolidays: updatedHolidays,
      });
    }
    setIsHolidayModalOpen(false);
  };

  // Remove holiday
  const handleRemoveHoliday = (dStr: string) => {
    if (onUpdateSettings && settings.customHolidays) {
      const updated = { ...settings.customHolidays };
      delete updated[dStr];
      onUpdateSettings({
        ...settings,
        customHolidays: updated,
      });
    }
  };

  // Helper to format time (e.g. '07:15:00' -> '7.15')
  const formatTimeDisplay = (timeStr?: string): string => {
    if (!timeStr) return '';
    const clean = timeStr.trim();
    if (clean.includes(':')) {
      const [h, m] = clean.split(':');
      const hourInt = parseInt(h, 10);
      return `${hourInt}.${m}`;
    }
    return clean;
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportOfficialMonthlyRecapExcel({
      settings,
      teachers: filteredTeachers,
      attendanceRecords,
      selectedMonth,
      daysInfo,
      schoolAddress,
      nss,
      npsn,
      countKS,
      countGuru,
      countTU,
    });
  };

  // Export to Official PDF
  const handleExportPDF = () => {
    exportOfficialMonthlyRecapPDF({
      settings,
      teachers: filteredTeachers,
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
      statusFilter: selectedStatusFilter,
    });
  };


  return (
    <div className="space-y-5">
      {/* Top Banner & Control Bar - Merah & Putih SD Elegan */}
      <div className="bg-[#8b101b] border-2 border-red-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
              <span className="w-3 h-3 rounded-full bg-red-200"></span>
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                REKAPITULASI PRESENSI BULANAN GURU & PTK
              </h2>
            </div>
            <div className="text-xs text-red-100/90 font-mono space-y-0.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">NSS / NPSN</span>
                <span>: {nss} / {npsn}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Alamat</span>
                <span>: {schoolAddress}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-red-100/90 pt-0.5 font-sans">
                <span>Jumlah KS : <strong className="text-white">{countKS} Orang</strong></span>
                <span>Jumlah Guru : <strong className="text-white">{countGuru} Orang</strong></span>
                <span>Jumlah TU/ Operator : <strong className="text-white">{countTU} Orang</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Month Picker */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Navigator */}
            <div className="flex items-center bg-[#670c14] border border-white/30 rounded-xl px-2 py-1 shadow-inner">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                title="Bulan Sebelumnya"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <div className="px-3 text-center">
                <span className="text-xs font-bold text-white uppercase block tracking-wider">
                  {monthLabel}
                </span>
                <span className="text-[9px] text-red-200 font-mono">{selectedMonth}</span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                title="Bulan Berikutnya"
              >
                <i className="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>

            {/* Input Absen Masa Lampau / Lupa Absen (Prominent) */}
            <button
              type="button"
              onClick={() => {
                setRetroTeacherId(teachers[0]?.id || '');
                setRetroDate(new Date().toISOString().slice(0, 10));
                setRetroExistingRecord(null);
                setIsRetroModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-950 font-extrabold text-xs shadow-lg shadow-red-950/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white"
            >
              <i className="fa-solid fa-clock-rotate-left text-red-700"></i>
              <span>+ Absen Masa Lampau / Lupa Absen</span>
            </button>

            {/* Kelola Tanggal Merah / Libur */}
            <button
              type="button"
              onClick={() => {
                setHolidayDate(`${selectedMonth}-01`);
                setHolidayTitle('Libur Semester');
                setIsHolidayModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-[#780d15] hover:bg-red-900 border border-red-700/60 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-calendar-xmark text-red-300"></i>
              <span>+ Atur Tanggal Merah</span>
            </button>

            {/* Atur Logo Kop (Kabupaten & Dinas / Sekolah) */}
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#780d15] hover:bg-red-900 border border-red-700/60 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Upload dan ganti logo Kabupaten serta logo Dinas / Sekolah"
            >
              <i className="fa-solid fa-image text-red-200"></i>
              <span>Atur Logo</span>
            </button>

            {/* Tombol Absen Cepat (Tepat di samping Atur Logo, bisa diaktifkan/dinonaktifkan di Edit Profil) */}
            {settings.enableQuickBulkAttendance !== false && (
              <button
                type="button"
                onClick={() => setIsQuickBulkModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95 cursor-pointer border border-amber-300"
                title="Absen cepat seluruh guru & tendik (Pilihan: 1 Hari atau 1 Bulan Penuh)"
              >
                <i className="fa-solid fa-bolt text-slate-950"></i>
                <span>⚡ Absen Cepat</span>
              </button>
            )}

            {/* Export Excel (.xlsx) */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-[#6a0c14] hover:bg-red-900 border border-red-500/50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Unduh file Excel sesuai format dinas resmi"
            >
              <i className="fa-solid fa-file-excel text-red-200"></i>
              <span>Export Excel</span>
            </button>

            {/* Unduh PDF (Resmi Landscape A4) */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-900 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer border border-white"
              title="Unduh file PDF resmi format dinas lengkap dengan Kop & Tanda Tangan"
            >
              <i className="fa-solid fa-file-pdf text-red-700"></i>
              <span>Unduh PDF</span>
            </button>

            {/* Print Browser / PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Cetak format cetak resmi (Gunakan orientasi Landscape)"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-4 pt-3 border-t border-red-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-red-200 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama guru, NIP, atau jabatan..."
                className="w-full bg-[#670c14] border border-red-700/60 focus:border-white rounded-xl pl-8 pr-3 py-1.5 text-white placeholder-red-200/60 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-red-100 font-medium">Status Kepegawaian:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#670c14] border border-red-700/60 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:outline-none"
            >
              <option value="Semua">Semua Status (Urut: PNS → P3K → Honor K-2 → Honorer Sekolah)</option>
              <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
              <option value="PPPK">P3K / PPPK</option>
              <option value="Honor K-2">Honor K-2</option>
              <option value="Honorer Sekolah">Honorer Sekolah</option>
            </select>
          </div>

          <div className="text-[11px] text-white/90 font-medium flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-600 inline-block rounded-xs border border-white/40"></span>
              <span>Hari Minggu / Libur (Merah)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-white inline-block rounded-xs border border-slate-400"></span>
              <span>Hari Kerja Efektif</span>
            </span>
            <span className="text-red-200">
              💡 Klik pada kotak tanggal untuk input/koreksi absen
            </span>
          </div>
        </div>
      </div>

      {/* Official Monthly Rekap Table Container (Spreadsheet Styled) */}
      <div
        id="official-rekap-sheet"
        className="official-print-wrapper bg-white rounded-xl border border-slate-300 shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none print:m-0 print:p-0"
      >
        {/* Official Kop Surat Dinas Pendidikan & Kebudayaan Parigi Moutong */}
        <OfficialReportKop
          schoolName={settings.schoolName || 'SDN Kecil Ogomojolo'}
          nss={nss}
          npsn={npsn}
          schoolAddress={schoolAddress}
          monthLabel={monthLabel}
          countKS={countKS}
          countGuru={countGuru}
          countTU={countTU}
          selectedStatusFilter={selectedStatusFilter}
          schoolRegency={settings.schoolRegency}
          schoolDepartment={settings.schoolDepartment}
          logoKabupatenUrl={settings.logoKabupatenUrl}
          logoDinasUrl={settings.logoDinasUrl}
          onOpenLogoSettings={onUpdateSettings ? () => setIsLogoModalOpen(true) : undefined}
        />

        <div className="overflow-x-auto print:overflow-visible">

          <table
            className="w-full text-left border-collapse select-none"
            style={{ minWidth: `${320 + daysInfo.length * 36 + 60}px` }}
          >
            {/* Table Header Row 1: Main Columns & Spanned TANGGAL / PARAF */}
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-[11px] font-black border-b border-slate-300">
                <th
                  rowSpan={2}
                  className="w-10 text-center border-r border-slate-300 px-1 py-2 font-bold"
                >
                  NO
                </th>
                <th
                  rowSpan={2}
                  className="w-64 border-r border-slate-300 px-3 py-2 text-left font-black"
                >
                  NAMA / NIP &amp; BIODATA PTK
                </th>
                <th
                  rowSpan={2}
                  className="w-24 text-center border-r border-slate-300 px-2 py-2 font-bold text-slate-600 uppercase text-[9px]"
                >
                  KETERANGAN
                </th>
                <th
                  colSpan={daysInfo.length}
                  className="text-center border-r border-slate-300 py-1.5 bg-slate-200/90 font-black tracking-widest text-[11px] uppercase"
                >
                  TANGGAL / PARAF &amp; JAM
                </th>
                <th
                  rowSpan={2}
                  className="w-14 text-center border-l border-slate-300 px-1 py-2 font-black text-slate-800 uppercase text-[10px]"
                >
                  KET
                </th>
              </tr>

              {/* Table Header Row 2: Date Numbers (1..31) with Sundays & Holidays in Solid Red */}
              <tr className="border-b-2 border-slate-400 text-center text-[10px]">
                {daysInfo.map((day) => {
                  const isRed = day.isSunday || day.isHoliday;
                  return (
                    <th
                      key={day.dateStr}
                      className={`w-9 min-w-[34px] max-w-[38px] py-1 px-0.5 border-r border-slate-300 ${
                        isRed
                          ? 'bg-red-600 text-white font-black'
                          : 'bg-slate-100 text-slate-800 font-bold hover:bg-slate-200'
                      }`}
                      title={`${day.dayName}, ${day.dayNumber} ${monthLabel}${day.holidayName ? ` (${day.holidayName})` : ''}`}
                    >
                      <div className="leading-tight">
                        <span className="block text-[11px]">{day.dayNumber}</span>
                        <span className="block text-[7px] uppercase opacity-90 truncate">
                          {day.dayName.slice(0, 3)}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body: 4 Sub-Rows per Teacher */}
            <tbody className="text-[10px] text-slate-800 font-sans divide-y divide-slate-300">
              {filteredTeachers.map((teacher, tIdx) => {
                const employmentStatus = teacher.employmentStatus || 'PNS';
                const isPPPK = employmentStatus === 'PPPK';
                const isPNS = employmentStatus === 'PNS';

                return (
                  <React.Fragment key={teacher.id}>
                    {/* Row 1: Paraf Masuk */}
                    <tr className="hover:bg-amber-50/40 transition-colors">
                      {/* NO (Spans 4 rows) */}
                      <td
                        rowSpan={4}
                        className="text-center font-bold border-r border-b border-slate-300 bg-slate-50/50 text-slate-700 align-middle"
                      >
                        {tIdx + 1}
                      </td>

                      {/* NAMA / NIP & Biodata (Spans 4 rows, exact layout as photo) */}
                      <td
                        rowSpan={4}
                        className="p-2 border-r border-b border-slate-300 bg-white align-top leading-tight"
                      >
                        <h4 className="font-black text-slate-900 text-[11.5px] uppercase tracking-tight">
                          {teacher.name}
                        </h4>
                        <div className="mt-1 space-y-0.5 text-[9px] text-slate-600 font-mono">
                          <div>
                            <span className="text-slate-500 font-semibold">NUPTK.</span>{' '}
                            <span className="font-bold text-slate-800">
                              {teacher.nuptk || teacher.nisn || '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-semibold">NIP. :</span>{' '}
                            <span className="font-bold text-slate-800">
                              {teacher.nip || teacher.nis || '-'}
                            </span>
                          </div>
                          <div className="font-sans text-[9px]">
                            <span className="text-slate-500 font-medium">Pangkat.Gol :</span>{' '}
                            <span className="font-semibold text-slate-700">
                              {teacher.rankGrade && teacher.rankGrade.trim() ? teacher.rankGrade : '-'}
                            </span>
                          </div>
                          <div className="font-sans text-[9px] truncate" title={teacher.address || '-'}>
                            <span className="text-slate-500 font-medium">Almt :</span>{' '}
                            <span className="text-slate-700">
                              {teacher.address && teacher.address.trim() ? teacher.address : '-'}
                            </span>
                          </div>
                          <div className="font-sans text-[9px]">
                            <span className="text-slate-500 font-medium">Jrk Rmh dr sekolah :</span>{' '}
                            <span className="text-slate-700">
                              {teacher.schoolDistance && teacher.schoolDistance.trim() ? teacher.schoolDistance : '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Label 1: Paraf masuk */}
                      <td className="px-2 py-1 text-left font-medium border-r border-b border-slate-200 bg-slate-50/70 text-slate-700 text-[9px] whitespace-nowrap">
                        Paraf masuk
                      </td>

                      {/* Date Cells for Row 1 */}
                      {daysInfo.map((day) => {
                        // Check if day is Sunday: Use rowSpan=4 so Sunday occupies all 4 rows in solid RED!
                        if (day.isSunday) {
                          return (
                            <td
                              key={`sun-${day.dateStr}-${teacher.id}`}
                              rowSpan={4}
                              className="bg-red-600 border-r border-b border-red-700 text-white text-center align-middle font-black p-0 select-none"
                              style={{ width: '36px' }}
                              title={`${day.dateStr}: Hari Minggu`}
                            >
                              <div className="flex flex-col items-center justify-center h-full py-2 tracking-widest text-[9.5px] font-black leading-tight text-white uppercase">
                                <span>M</span>
                                <span>i</span>
                                <span>n</span>
                                <span>g</span>
                                <span>g</span>
                                <span>u</span>
                              </div>
                            </td>
                          );
                        }

                        // Check if day is holiday (e.g. Libur Semester as seen in photo)
                        if (day.isHoliday) {
                          return (
                            <td
                              key={`hol-${day.dateStr}-${teacher.id}`}
                              rowSpan={4}
                              className="bg-rose-50 border-r border-b border-rose-300 text-rose-700 text-center align-middle p-0 select-none cursor-pointer hover:bg-rose-100"
                              onClick={() => handleCellClick(teacher, day)}
                              title={`${day.dateStr}: ${day.holidayName || 'Libur'} (Klik untuk isi presensi jika bertugas)`}
                            >
                              <div className="writing-mode-vertical py-1 px-0.5 text-[8px] font-bold tracking-tight text-rose-600 max-h-24 truncate">
                                {day.holidayName || 'Libur'}
                              </div>
                            </td>
                          );
                        }

                        // Workday: lookup attendance
                        const record = attendanceRecords.find(
                          (r) =>
                            (r.guruId === teacher.id ||
                              r.studentId === teacher.id ||
                              (r.nip && teacher.nip && r.nip === teacher.nip) ||
                              (r.nis && teacher.nis && r.nis === teacher.nis)) &&
                            r.date === day.dateStr
                        );

                        return (
                          <td
                            key={`p-in-${day.dateStr}-${teacher.id}`}
                            className="text-center border-r border-b border-slate-200 px-0.5 py-1 align-middle cursor-pointer hover:bg-amber-100/70 transition-colors group relative"
                            onClick={() => handleCellClick(teacher, day)}
                            title={`${day.dateStr} - ${teacher.name}: ${
                              record ? `${record.status} (${resolveAttendanceEntryTime(record, settings)})` : 'Klik untuk input presensi'
                            }`}
                          >
                            {record ? (
                              record.status === 'Hadir' || record.status === 'Terlambat' ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-emerald-700 font-bold text-xs">
                                  ✓
                                </span>
                              ) : record.status === 'Dinas Luar' ? (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  DL
                                </span>
                              ) : record.status === 'Izin' ? (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                                  I
                                </span>
                              ) : record.status === 'Sakit' ? (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                                  S
                                </span>
                              ) : (
                                <span className="px-1 py-0.2 rounded text-[7.5px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  A
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300 text-[8px] group-hover:text-amber-600 font-mono">
                                •
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* KET Column (Spans 4 rows) */}
                      <td
                        rowSpan={4}
                        className="text-center font-black border-l border-b border-slate-300 bg-slate-50 align-middle p-1"
                      >
                        <div
                          className={`inline-block py-1 px-1.5 rounded text-[9.5px] font-black tracking-wider ${
                            isPNS
                              ? 'text-slate-900 bg-emerald-50 border border-emerald-300'
                              : isPPPK
                              ? 'text-amber-900 bg-amber-50 border border-amber-300'
                              : 'text-blue-900 bg-blue-50 border border-blue-300'
                          }`}
                        >
                          {employmentStatus}
                        </div>
                      </td>
                    </tr>

                    {/* Row 2: Jam Masuk */}
                    <tr className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-2 py-0.5 text-left font-semibold border-r border-b border-slate-200 bg-slate-50 text-slate-600 text-[8.5px]">
                        Jam
                      </td>
                      {daysInfo.map((day) => {
                        if (day.isSunday || day.isHoliday) return null; // Handled by rowSpan=4

                        const record = attendanceRecords.find(
                          (r) =>
                            (r.guruId === teacher.id ||
                              r.studentId === teacher.id ||
                              (r.nip && teacher.nip && r.nip === teacher.nip) ||
                              (r.nis && teacher.nis && r.nis === teacher.nis)) &&
                            r.date === day.dateStr
                        );

                        const timeDisplay = record ? resolveAttendanceEntryTime(record, settings) : '';

                        return (
                          <td
                            key={`t-in-${day.dateStr}-${teacher.id}`}
                            className="text-center font-mono text-[8px] border-r border-b border-slate-200 px-0.5 py-0.5 text-slate-700 cursor-pointer hover:bg-amber-100/70"
                            onClick={() => handleCellClick(teacher, day)}
                          >
                            {formatTimeDisplay(timeDisplay) || ''}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 3: Paraf Keluar */}
                    <tr className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-2 py-1 text-left font-medium border-r border-b border-slate-200 bg-slate-50/70 text-slate-700 text-[9px] whitespace-nowrap">
                        Paraf Keluar
                      </td>
                      {daysInfo.map((day) => {
                        if (day.isSunday || day.isHoliday) return null; // Handled by rowSpan=4

                        const record = attendanceRecords.find(
                          (r) =>
                            (r.guruId === teacher.id ||
                              r.studentId === teacher.id ||
                              (r.nip && teacher.nip && r.nip === teacher.nip) ||
                              (r.nis && teacher.nis && r.nis === teacher.nis)) &&
                            r.date === day.dateStr
                        );

                        const hasSignedOut =
                          record?.timeOut ||
                          (record && (record.status === 'Hadir' || record.status === 'Terlambat'));

                        return (
                          <td
                            key={`p-out-${day.dateStr}-${teacher.id}`}
                            className="text-center border-r border-b border-slate-200 px-0.5 py-1 align-middle cursor-pointer hover:bg-amber-100/70 transition-colors group"
                            onClick={() => handleCellClick(teacher, day)}
                          >
                            {hasSignedOut ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 text-emerald-700 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[8px] group-hover:text-amber-600 font-mono">
                                •
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 4: Jam Keluar */}
                    <tr className="hover:bg-amber-50/40 transition-colors border-b-2 border-slate-300">
                      <td className="px-2 py-0.5 text-left font-semibold border-r border-b border-slate-300 bg-slate-50 text-slate-600 text-[8.5px]">
                        Jam
                      </td>
                      {daysInfo.map((day) => {
                        if (day.isSunday || day.isHoliday) return null; // Handled by rowSpan=4

                        const record = attendanceRecords.find(
                          (r) =>
                            (r.guruId === teacher.id ||
                              r.studentId === teacher.id ||
                              (r.nip && teacher.nip && r.nip === teacher.nip) ||
                              (r.nis && teacher.nis && r.nis === teacher.nis)) &&
                            r.date === day.dateStr
                        );

                        const timeOutDisplay = record ? resolveAttendanceReturnTime(record, settings) : '';

                        return (
                          <td
                            key={`t-out-${day.dateStr}-${teacher.id}`}
                            className="text-center font-mono text-[8px] border-r border-b border-slate-300 px-0.5 py-0.5 text-slate-700 cursor-pointer hover:bg-amber-100/70"
                            onClick={() => handleCellClick(teacher, day)}
                          >
                            {formatTimeDisplay(timeOutDisplay) || ''}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Official Signatures Block: Korwil & Kepala Sekolah */}
        <OfficialSignaturesBlock settings={settings} selectedMonth={selectedMonth} />
      </div>


      {/* Retroactive Attendance Modal */}
      <RetroactiveAttendanceModal
        isOpen={isRetroModalOpen}
        onClose={() => setIsRetroModalOpen(false)}
        teachers={teachers}
        selectedDate={retroDate}
        preselectedTeacherId={retroTeacherId}
        currentTeacher={currentTeacher}
        onSaveAttendance={(record) => {
          if (onSaveAttendanceRecord) {
            onSaveAttendanceRecord(record);
          }
          setIsRetroModalOpen(false);
        }}
        existingRecord={retroExistingRecord}
        schoolId={settings.schoolId}
        settings={settings}
      />

      {/* Holiday / Tanggal Merah Management Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#450a0a] border-2 border-red-500/50 rounded-2xl w-full max-w-md text-white shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-900">
              <h3 className="font-bold text-sm text-red-200 flex items-center gap-2">
                <i className="fa-solid fa-calendar-xmark text-red-400"></i>
                Atur Tanggal Merah / Libur Sekolah
              </h3>
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="space-y-3 text-xs">
              <div>
                <label className="block text-red-200 font-semibold mb-1">
                  Pilih Tanggal Merah / Libur
                </label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full bg-[#2a0606] border border-red-800 focus:border-red-400 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-red-200 font-semibold mb-1">
                  Nama Hari Libur / Keterangan
                </label>
                <input
                  type="text"
                  value={holidayTitle}
                  onChange={(e) => setHolidayTitle(e.target.value)}
                  placeholder="Contoh: Libur Semester / Cuti Bersama"
                  className="w-full bg-[#2a0606] border border-red-800 focus:border-red-400 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                  required
                />
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Libur Semester', 'Cuti Bersama', 'Libur Awal Ramadhan', 'Libur Idul Fitri', 'Hari Libur Khusus Sekolah'].map(
                  (sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setHolidayTitle(sug)}
                      className="px-2 py-0.5 rounded bg-[#1c0404] text-[10px] text-red-200 hover:text-white border border-red-900"
                    >
                      + {sug}
                    </button>
                  )
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-red-900">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-red-800 text-red-200 hover:bg-white/5"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Tandai Merah
                </button>
              </div>
            </form>

            {/* List of currently registered custom holidays */}
            {settings.customHolidays && Object.keys(settings.customHolidays).length > 0 && (
              <div className="pt-3 border-t border-red-900 space-y-2">
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider block">
                  Daftar Libur Khusus Sekolah:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px]">
                  {Object.entries(settings.customHolidays).map(([d, name]) => (
                    <div
                      key={d}
                      className="flex items-center justify-between bg-[#1c0404] px-2.5 py-1.5 rounded-lg border border-red-950"
                    >
                      <div>
                        <span className="font-mono font-bold text-red-300 mr-2">{d}</span>
                        <span className="text-white">{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHoliday(d)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-1"
                        title="Hapus libur ini"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Pengaturan Logo Kop Resmi (Kabupaten & Dinas/Sekolah) */}
      {isLogoModalOpen && onUpdateSettings && (
        <LogoSettingsModal
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setIsLogoModalOpen(false)}
        />
      )}

      {/* Modal Absen Cepat (Harian & 1 Bulan Penuh) */}
      {isQuickBulkModalOpen && onBulkSaveAttendanceRecords && (
        <QuickBulkAttendanceModal
          isOpen={isQuickBulkModalOpen}
          onClose={() => setIsQuickBulkModalOpen(false)}
          teachers={teachers}
          attendanceRecords={attendanceRecords}
          settings={settings}
          selectedMonth={selectedMonth}
          schoolId={settings.schoolId}
          onBulkSaveAttendance={onBulkSaveAttendanceRecords}
        />
      )}
    </div>
  );
};
