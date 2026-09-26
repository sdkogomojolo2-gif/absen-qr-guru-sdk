import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Student, SystemSettings } from '../types';
import { ParigiMoutongLogo } from './ParigiMoutongLogo';
import { TutWuriHandayaniLogo } from './TutWuriHandayaniLogo';
import { getCanonicalStatusGroup, normalizeEmploymentStatus } from '../utils/statusUtils';

interface TeacherListPrintModalProps {
  students: Student[];
  settings: SystemSettings;
  selectedIds?: string[];
  onClose: () => void;
}

export const TeacherListPrintModal: React.FC<TeacherListPrintModalProps> = ({
  students,
  settings,
  selectedIds,
  onClose,
}) => {
  // Filters & Customization State
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [genderFilter, setGenderFilter] = useState<string>('Semua');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Column Visibility Toggles
  const [showNip, setShowNip] = useState<boolean>(true);
  const [showRank, setShowRank] = useState<boolean>(true);
  const [showPosition, setShowPosition] = useState<boolean>(true);
  const [showStatus, setShowStatus] = useState<boolean>(true);
  const [showGender, setShowGender] = useState<boolean>(true);
  const [showPhone, setShowPhone] = useState<boolean>(true);
  const [showSignatureCol, setShowSignatureCol] = useState<boolean>(true);

  // Editable Signature Details
  const defaultCity = settings.signatureCity || settings.schoolCity || 'Palasa Lambori';
  const defaultDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const [signaturePlaceDate, setSignaturePlaceDate] = useState<string>(
    `${defaultCity}, ${defaultDateStr}`
  );
  const [headmasterName, setHeadmasterName] = useState<string>(
    settings.headmasterName || 'RAHMAT, S.Pd., M.Pd'
  );
  const [headmasterNip, setHeadmasterNip] = useState<string>(
    settings.headmasterNip || '19851204 200903 1 002'
  );

  // Filtered List
  const filteredTeachers = useMemo(() => {
    return students.filter((t) => {
      // If initial selectedIds was provided, filter by that if wanted
      if (selectedIds && selectedIds.length > 0 && !selectedIds.includes(t.id)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'Semua') {
        const canonical = getCanonicalStatusGroup(t.employmentStatus);
        if (statusFilter === 'PNS' && canonical !== 'PNS') return false;
        if (statusFilter === 'P3K' && canonical !== 'P3K') return false;
        if (statusFilter === 'Honorer' && canonical !== 'Honor K-2' && canonical !== 'Honorer Sekolah') return false;
      }

      // Gender filter
      if (genderFilter !== 'Semua' && t.gender !== genderFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nip = (t.nip || t.nis || t.nuptk || '').toLowerCase();
        const name = (t.name || '').toLowerCase();
        const pos = (t.position || t.classRoom || '').toLowerCase();
        if (!nip.includes(q) && !name.includes(q) && !pos.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedIds, statusFilter, genderFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let pns = 0;
    let p3k = 0;
    let honorer = 0;
    let laki = 0;
    let perempuan = 0;

    filteredTeachers.forEach((t) => {
      const canonical = getCanonicalStatusGroup(t.employmentStatus);
      if (canonical === 'PNS') pns++;
      else if (canonical === 'P3K') p3k++;
      else honorer++;

      if (t.gender === 'Laki-laki') laki++;
      else perempuan++;
    });

    return {
      total: filteredTeachers.length,
      pns,
      p3k,
      honorer,
      laki,
      perempuan,
    };
  }, [filteredTeachers]);

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const rows = filteredTeachers.map((t, idx) => {
      const rowData: Record<string, any> = {
        No: idx + 1,
      };

      if (showNip) {
        rowData['NIP / NUPTK'] = t.nip || t.nuptk || t.nis || '-';
      }

      rowData['Nama Lengkap & Gelar'] = t.name;

      if (showGender) {
        rowData['L/P'] = t.gender === 'Laki-laki' ? 'L' : 'P';
      }

      if (showRank) {
        rowData['Pangkat / Golongan'] = t.rankGrade || '-';
      }

      if (showPosition) {
        rowData['Jabatan / Tugas'] = t.position || t.classRoom || 'Guru';
      }

      if (showStatus) {
        rowData['Status Kepegawaian'] = normalizeEmploymentStatus(t.employmentStatus);
      }

      if (showPhone) {
        rowData['No. WhatsApp / HP'] = t.phone || t.parentPhone || '-';
      }

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Guru & PTK');

    const cleanSchoolName = (settings.schoolName || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `Daftar_Guru_PTK_${cleanSchoolName}_${todayStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const schoolName = (settings.schoolName || 'SDN KECIL OGOMOJOLO').toUpperCase();
  const schoolRegency = settings.schoolRegency || 'PEMERINTAH KABUPATEN PARIGI MOUTONG';
  const schoolDepartment = settings.schoolDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  const schoolAddress = settings.schoolAddress || 'Desa Palasa Lambori, Kec. Palasa';
  const npsn = settings.npsn || '69900000';
  const nss = settings.nss || '101240801000';
  const academicYear = settings.academicYear || '2025/2026';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:m-0 print:bg-white print:static print:overflow-visible animate-in fade-in duration-150">
      {/* Print Style Injector */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-teacher-list, #printable-teacher-list * {
            visibility: visible;
          }
          #printable-teacher-list {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
            margin: 10mm 12mm 12mm 12mm;
          }
          .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* NO-PRINT TOOLBAR & CONTROL PANEL */}
      <div className="no-print w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl mb-4 shrink-0 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/30">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <span>Cetak Daftar Guru & Tendik (PTK)</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  Format A4 Resmi
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar resmi tenaga pendidik lengkap dengan Kop Surat, tabel biodata, dan tanda tangan Kepala Sekolah.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Unduh data dalam format Excel (.xlsx)"
            >
              <i className="fa-solid fa-file-excel text-emerald-600"></i>
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
              title="Cetak langsung ke printer atau simpan sebagai PDF A4"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak / Simpan PDF (A4)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer ml-1"
              title="Tutup Modal"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3.5">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Status Kepegawaian:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
            >
              <option value="Semua">Semua Status (PNS, P3K, Honorer)</option>
              <option value="PNS">Hanya PNS</option>
              <option value="P3K">Hanya PPPK / P3K</option>
              <option value="Honorer">Hanya Honorer / Tendik</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Jenis Kelamin:
            </label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
            >
              <option value="Semua">Semua (Laki-laki & Perempuan)</option>
              <option value="Laki-laki">Laki-laki (L)</option>
              <option value="Perempuan">Perempuan (P)</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Orientasi Kertas A4:
            </label>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-file text-[11px]"></i>
                <span>Portrait</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <i className="fa-solid fa-file-invoice text-[11px] rotate-90"></i>
                <span>Landscape</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Pencarian Cepat:
            </label>
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIP, atau tugas..."
                className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Column Checkboxes */}
        <div className="flex items-center gap-4 flex-wrap pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider">Kolom:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showNip}
              onChange={(e) => setShowNip(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>NIP / NUPTK</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showGender}
              onChange={(e) => setShowGender(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>L/P</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showRank}
              onChange={(e) => setShowRank(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Gol / Pangkat</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showPosition}
              onChange={(e) => setShowPosition(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Jabatan / Tugas</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showStatus}
              onChange={(e) => setShowStatus(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Status</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>No. WhatsApp</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showSignatureCol}
              onChange={(e) => setShowSignatureCol(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Kolom Tanda Tangan (Paraf)</span>
          </label>
        </div>

        {/* Signature Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              Tempat & Tanggal TTD:
            </label>
            <input
              type="text"
              value={signaturePlaceDate}
              onChange={(e) => setSignaturePlaceDate(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              placeholder="Contoh: Palasa Lambori, 31 Agustus 2026"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              Nama Kepala Sekolah:
            </label>
            <input
              type="text"
              value={headmasterName}
              onChange={(e) => setHeadmasterName(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
              NIP Kepala Sekolah:
            </label>
            <input
              type="text"
              value={headmasterNip}
              onChange={(e) => setHeadmasterNip(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL DOCUMENT CONTAINER (STANDARD A4 PAPER STYLING)        */}
      {/* ========================================================================= */}
      <div
        id="printable-teacher-list"
        className={`w-full bg-white text-black p-6 sm:p-10 shadow-2xl rounded-2xl print:shadow-none print:rounded-none mx-auto ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
        }`}
        style={{
          fontFamily: "'Times New Roman', Times, serif, 'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* OFFICIAL KOP SURAT */}
        <div className="border-b-4 border-double border-black pb-3 mb-4 select-none">
          <div className="flex items-center justify-between gap-4">
            {/* Left Crest */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {settings.logoKabupatenUrl ? (
                <img
                  src={settings.logoKabupatenUrl}
                  alt="Logo Kabupaten"
                  className="max-h-20 max-w-20 object-contain"
                />
              ) : (
                <ParigiMoutongLogo className="w-16 h-18 text-black" />
              )}
            </div>

            {/* Header Text */}
            <div className="flex-1 text-center space-y-0.5 px-2">
              <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-black">
                {schoolRegency}
              </h4>
              <h3 className="text-xs sm:text-base font-extrabold tracking-wider uppercase text-black">
                {schoolDepartment}
              </h3>
              <h2 className="text-base sm:text-xl font-black tracking-wide uppercase text-black">
                {schoolName}
              </h2>
              <p className="text-[11px] sm:text-xs text-black leading-tight">
                Alamat: {schoolAddress}
              </p>
              <p className="text-[10px] sm:text-[11px] text-black font-semibold">
                NSS: {nss} | NPSN: {npsn}
              </p>
            </div>

            {/* Right Crest */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {settings.logoDinasUrl ? (
                <img
                  src={settings.logoDinasUrl}
                  alt="Logo Dinas"
                  className="max-h-20 max-w-20 object-contain"
                />
              ) : (
                <TutWuriHandayaniLogo className="w-16 h-18 text-black" />
              )}
            </div>
          </div>
        </div>

        {/* DOCUMENT TITLE */}
        <div className="text-center my-4">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wider underline">
            DAFTAR GURU DAN TENAGA KEPENDIDIKAN (PTK)
          </h2>
          <p className="text-xs font-bold text-black mt-1">
            TAHUN AJARAN {academicYear}
            {statusFilter !== 'Semua' ? ` • STATUS: ${statusFilter.toUpperCase()}` : ''}
          </p>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="flex items-center justify-between text-[11px] font-semibold mb-2.5 px-1 text-black border-b border-black pb-1.5">
          <div className="flex items-center gap-3">
            <span>
              Total: <strong>{stats.total} Orang</strong>
            </span>
            <span>(L: {stats.laki}, P: {stats.perempuan})</span>
          </div>
          <div className="flex items-center gap-3">
            <span>PNS: <strong>{stats.pns}</strong></span>
            <span>PPPK: <strong>{stats.p3k}</strong></span>
            <span>Honorer/Tendik: <strong>{stats.honorer}</strong></span>
          </div>
        </div>

        {/* DATA TABLE */}
        <table className="w-full border-collapse border border-black text-[11px] leading-tight text-black">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th className="border border-black px-2 py-1.5 w-8">NO</th>
              {showNip && (
                <th className="border border-black px-2 py-1.5 w-36">
                  NIP / NUPTK / NIK
                </th>
              )}
              <th className="border border-black px-2 py-1.5 text-left">
                NAMA LENGKAP & GELAR
              </th>
              {showGender && (
                <th className="border border-black px-1.5 py-1.5 w-10">L/P</th>
              )}
              {showRank && (
                <th className="border border-black px-2 py-1.5 w-24">
                  GOL / PANGKAT
                </th>
              )}
              {showPosition && (
                <th className="border border-black px-2 py-1.5 text-left w-36">
                  JABATAN / TUGAS
                </th>
              )}
              {showStatus && (
                <th className="border border-black px-2 py-1.5 w-24">
                  STATUS
                </th>
              )}
              {showPhone && (
                <th className="border border-black px-2 py-1.5 w-28">
                  NO. HP / WA
                </th>
              )}
              {showSignatureCol && (
                <th className="border border-black px-2 py-1.5 w-28">
                  PARAF / TTD
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-black text-center py-6 text-xs italic text-black"
                >
                  Tidak ada data guru atau tenaga kependidikan yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher, index) => {
                const nipVal = teacher.nip || teacher.nuptk || teacher.nis || '-';
                const posVal = teacher.position || teacher.classRoom || 'Guru';
                const statusVal = normalizeEmploymentStatus(teacher.employmentStatus);
                const phoneVal = teacher.phone || teacher.parentPhone || '-';
                const rankVal = teacher.rankGrade || '-';

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="border border-black text-center py-1.5 px-1 font-semibold">
                      {index + 1}
                    </td>
                    {showNip && (
                      <td className="border border-black px-2 py-1.5 font-mono text-[10px] text-center">
                        {nipVal}
                      </td>
                    )}
                    <td className="border border-black px-2.5 py-1.5 font-bold text-left">
                      {teacher.name}
                    </td>
                    {showGender && (
                      <td className="border border-black text-center py-1.5 px-1 font-semibold">
                        {teacher.gender === 'Laki-laki' ? 'L' : 'P'}
                      </td>
                    )}
                    {showRank && (
                      <td className="border border-black px-2 py-1.5 text-center font-medium">
                        {rankVal}
                      </td>
                    )}
                    {showPosition && (
                      <td className="border border-black px-2 py-1.5 text-left font-medium">
                        {posVal}
                      </td>
                    )}
                    {showStatus && (
                      <td className="border border-black px-2 py-1.5 text-center font-semibold text-[10px]">
                        {statusVal}
                      </td>
                    )}
                    {showPhone && (
                      <td className="border border-black px-2 py-1.5 text-center font-mono text-[10px]">
                        {phoneVal}
                      </td>
                    )}
                    {showSignatureCol && (
                      <td className="border border-black px-2 py-1.5 text-left text-[9px] text-slate-400">
                        {index % 2 === 0 ? `${index + 1}. .........` : `    ${index + 1}. .........`}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* OFFICIAL SIGNATURE BLOCK */}
        <div className="mt-8 page-break-inside-avoid flex justify-end select-none">
          <div className="text-center w-64 text-xs text-black space-y-1">
            <p>{signaturePlaceDate}</p>
            <p className="font-bold">Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah {schoolName}</p>

            {/* Signature blank space / stamp slot */}
            <div className="h-16 flex items-center justify-center">
              {/* Optional digital seal or empty space for physical wet stamp and signature */}
            </div>

            <p className="font-black underline text-sm tracking-wide">
              {headmasterName}
            </p>
            <p className="text-[11px] font-semibold">
              NIP. {headmasterNip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
