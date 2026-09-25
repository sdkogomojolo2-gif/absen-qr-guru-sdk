import React, { useState, useMemo } from 'react';
import { Guru, AttendanceStatus, AttendanceRecord, SystemSettings } from '../types';
import { getMonthDaysInfo } from '../utils/holidayUtils';
import { getDayScheduleForDate, getScheduledEntryTimeForDate } from '../utils/scheduleUtils';
import { DEFAULT_PRIMARY_SCHOOL_ID } from '../data/initialData';

interface QuickBulkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Guru[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  selectedMonth: string; // e.g. "2026-09"
  schoolId?: string;
  onBulkSaveAttendance: (records: AttendanceRecord[]) => Promise<void> | void;
}

export const QuickBulkAttendanceModal: React.FC<QuickBulkAttendanceModalProps> = ({
  isOpen,
  onClose,
  teachers,
  attendanceRecords,
  settings,
  selectedMonth: initialSelectedMonth,
  schoolId,
  onBulkSaveAttendance,
}) => {
  // Mode: 'date' (1 Hari Tertentu) atau 'month' (1 Bulan Penuh)
  const [activeMode, setActiveMode] = useState<'date' | 'month'>('month');

  // Input States for Date Mode
  const [targetDate, setTargetDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Input States for Month Mode
  const [targetMonth, setTargetMonth] = useState<string>(() => {
    return initialSelectedMonth || new Date().toISOString().slice(0, 7);
  });

  // Attendance Status to populate (Default: 'Hadir')
  const [targetStatus, setTargetStatus] = useState<AttendanceStatus>('Hadir');

  // Time handling: 'auto' (sesuai jadwal sekolah) atau 'custom' (jam tentuan sendiri)
  const [timeMode, setTimeMode] = useState<'auto' | 'custom'>('auto');
  const [customTimeIn, setCustomTimeIn] = useState<string>('07:00');
  const [customTimeOut, setCustomTimeOut] = useState<string>('14:00');

  // Overwrite Option
  // 'only_empty' = Hanya isi tanggal/guru yang belum ada presensinya (Aman)
  // 'all' = Isi semua (menimpa presensi yang ada)
  const [overwriteMode, setOverwriteMode] = useState<'only_empty' | 'all'>('only_empty');

  // Selected Teacher IDs (Default: all checked)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(() => {
    return new Set(teachers.map((t) => t.id));
  });

  // Loading/submitting state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<string>('');

  // Keep selectedTeacherIds updated if teachers list changes
  React.useEffect(() => {
    if (teachers.length > 0 && selectedTeacherIds.size === 0) {
      setSelectedTeacherIds(new Set(teachers.map((t) => t.id)));
    }
  }, [teachers]);

  // Sync initial month when modal opens
  React.useEffect(() => {
    if (isOpen && initialSelectedMonth) {
      setTargetMonth(initialSelectedMonth);
    }
  }, [isOpen, initialSelectedMonth]);

  // Existing records map for quick lookup: Map<`${date}_${guruId}`, AttendanceRecord>
  const existingRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((r) => {
      const gId = r.guruId || r.studentId;
      if (gId && r.date) {
        map.set(`${r.date}_${gId}`, r);
      }
    });
    return map;
  }, [attendanceRecords]);

  // Days info for Month Mode (excludes Sundays & Holidays)
  const monthEffectiveDays = useMemo(() => {
    if (activeMode !== 'month' || !targetMonth) return [];
    const allDays = getMonthDaysInfo(targetMonth, settings.customHolidays);

    // Filter only active effective working days
    return allDays.filter((d) => {
      if (d.isSunday) return false;
      if (d.isHoliday) return false;

      // Check daily schedules if day is marked as inactive
      const schedule = getDayScheduleForDate(d.dateStr, settings);
      if (schedule && schedule.isActive === false) return false;

      return true;
    });
  }, [activeMode, targetMonth, settings]);

  // Selected teachers list
  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => selectedTeacherIds.has(t.id));
  }, [teachers, selectedTeacherIds]);

  // Calculation of how many records will be generated/updated
  const previewStats = useMemo(() => {
    if (activeTeachers.length === 0) {
      return { totalToProcess: 0, newRecordsCount: 0, overwriteCount: 0, totalWorkDays: 0 };
    }

    if (activeMode === 'date') {
      let newCount = 0;
      let updateCount = 0;

      activeTeachers.forEach((t) => {
        const hasExisting = existingRecordsMap.has(`${targetDate}_${t.id}`);
        if (!hasExisting) {
          newCount++;
        } else if (overwriteMode === 'all') {
          updateCount++;
        }
      });

      return {
        totalToProcess: overwriteMode === 'all' ? newCount + updateCount : newCount,
        newRecordsCount: newCount,
        overwriteCount: updateCount,
        totalWorkDays: 1,
      };
    } else {
      // Month mode
      let newCount = 0;
      let updateCount = 0;

      monthEffectiveDays.forEach((day) => {
        activeTeachers.forEach((t) => {
          const hasExisting = existingRecordsMap.has(`${day.dateStr}_${t.id}`);
          if (!hasExisting) {
            newCount++;
          } else if (overwriteMode === 'all') {
            updateCount++;
          }
        });
      });

      return {
        totalToProcess: overwriteMode === 'all' ? newCount + updateCount : newCount,
        newRecordsCount: newCount,
        overwriteCount: updateCount,
        totalWorkDays: monthEffectiveDays.length,
      };
    }
  }, [activeMode, targetDate, monthEffectiveDays, activeTeachers, existingRecordsMap, overwriteMode]);

  // Select all / Deselect all teachers
  const handleToggleSelectAll = () => {
    if (selectedTeacherIds.size === teachers.length) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(teachers.map((t) => t.id)));
    }
  };

  const handleToggleTeacher = (teacherId: string) => {
    const next = new Set(selectedTeacherIds);
    if (next.has(teacherId)) {
      next.delete(teacherId);
    } else {
      next.add(teacherId);
    }
    setSelectedTeacherIds(next);
  };

  // Execution Handler
  const handleExecuteQuickBulk = async () => {
    if (activeTeachers.length === 0) {
      alert('Pilih minimal satu guru atau tenaga kependidikan.');
      return;
    }

    if (activeMode === 'date' && !targetDate) {
      alert('Mohon pilih tanggal presensi.');
      return;
    }

    if (activeMode === 'month' && monthEffectiveDays.length === 0) {
      alert('Tidak ada hari kerja efektif yang ditemukan pada bulan yang dipilih.');
      return;
    }

    if (previewStats.totalToProcess === 0) {
      alert(
        'Semua guru sudah memiliki rekaman presensi pada periode ini. Jika ingin memperbarui, ubah opsi ke "Perbarui/Timpa Data yang Ada".'
      );
      return;
    }

    const confirmMsg =
      activeMode === 'month'
        ? `Lanjutkan absen cepat 1 BULAN PENUH untuk ${activeTeachers.length} guru/tendik (${monthEffectiveDays.length} hari kerja efektif)? Total ${previewStats.totalToProcess} rekaman presensi akan disimpan.`
        : `Lanjutkan absen cepat tanggal ${targetDate} untuk ${activeTeachers.length} guru/tendik? Total ${previewStats.totalToProcess} rekaman presensi akan disimpan.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsProcessing(true);
    setProcessProgress('Menyiapkan data presensi otomatis...');

    try {
      const recordsToSave: AttendanceRecord[] = [];
      const effectiveSchoolId = schoolId || settings.schoolId || DEFAULT_PRIMARY_SCHOOL_ID;
      const targetDates =
        activeMode === 'date'
          ? [targetDate]
          : monthEffectiveDays.map((d) => d.dateStr);

      for (const dStr of targetDates) {
        // Resolve time for this specific day
        const daySchedule = getDayScheduleForDate(dStr, settings);
        const resolvedTimeIn =
          timeMode === 'custom'
            ? customTimeIn || '07:00'
            : getScheduledEntryTimeForDate(dStr, settings);
        const resolvedTimeOut =
          timeMode === 'custom'
            ? customTimeOut || '14:00'
            : daySchedule.returnStartTime || settings.returnStartTime || '14:00';

        for (const teacher of activeTeachers) {
          const lookupKey = `${dStr}_${teacher.id}`;
          const existing = existingRecordsMap.get(lookupKey);

          if (existing && overwriteMode === 'only_empty') {
            continue; // Skip because record already exists
          }

          const cleanTeacherId = (teacher.id || 'guru').replace(/[^a-zA-Z0-9_-]/g, '');
          const cleanDate = dStr.replace(/[^a-zA-Z0-9_-]/g, '');
          const recordId =
            existing?.id ||
            `att-bulk-${cleanDate}-${cleanTeacherId}-${Math.random().toString(36).substring(2, 7)}`;

          const record: AttendanceRecord = {
            id: recordId,
            schoolId: effectiveSchoolId,
            guruId: teacher.id,
            studentId: teacher.id,
            nip: teacher.nip || teacher.nis || '',
            nis: teacher.nip || teacher.nis || '',
            guruName: teacher.name,
            studentName: teacher.name,
            position: teacher.position || teacher.classRoom || 'Guru',
            classRoom: teacher.position || teacher.classRoom || 'Guru',
            employmentStatus: teacher.employmentStatus || 'PTK',
            date: dStr,
            time: `${resolvedTimeIn}:00`,
            timeIn: resolvedTimeIn,
            timeOut:
              targetStatus === 'Hadir' || targetStatus === 'Terlambat' || targetStatus === 'Dinas Luar'
                ? resolvedTimeOut
                : undefined,
            status: targetStatus,
            note:
              activeMode === 'month'
                ? 'Absen Cepat 1 Bulan Penuh Otomatis'
                : 'Absen Cepat Massal Otomatis',
            scannedVia: 'Manual Input',
          };

          recordsToSave.push(record);
        }
      }

      setProcessProgress(`Menyimpan ${recordsToSave.length} data presensi ke database...`);
      await onBulkSaveAttendance(recordsToSave);

      onClose();
    } catch (err: any) {
      console.error('Gagal melakukan absen cepat:', err);
      alert(`Gagal memproses absen cepat: ${err?.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsProcessing(false);
      setProcessProgress('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl relative my-auto animate-scale-up flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center text-lg font-black shadow-inner shrink-0">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Absen Cepat Guru &amp; Tendik
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-950/30 text-white border border-white/30 shrink-0">
                  ⚡ Kilat
                </span>
              </div>
              <p className="text-[11px] text-amber-100 font-medium truncate">
                Otomatisasi pengisian presensi seluruh guru/staf untuk 1 hari atau 1 bulan penuh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          
          {/* Tab Pilihan Mode: 1 Hari vs 1 Bulan Penuh */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('month')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'month'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <i className="fa-solid fa-calendar-days text-sm"></i>
              <span>1 Bulan Penuh (Full Bulan)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-950/15 text-[9px] font-black">
                Rekomendasi
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('date')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'date'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <i className="fa-regular fa-calendar-check text-sm"></i>
              <span>Per Tanggal Tertentu (1 Hari)</span>
            </button>
          </div>

          {/* Konfigurasi Berdasarkan Mode */}
          {activeMode === 'month' ? (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] font-black text-amber-950 uppercase tracking-wider mb-1">
                    Pilih Bulan &amp; Tahun yang Ingin Diabsen Full
                  </label>
                  <p className="text-[11px] text-amber-800">
                    Sistem otomatis mengabaikan Hari Minggu &amp; Tanggal Merah resmi.
                  </p>
                </div>
                <div className="shrink-0">
                  <input
                    type="month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="bg-white border-2 border-amber-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-amber-950 shadow-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Rincian Hari Kerja Efektif */}
              <div className="bg-white border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                  <div>
                    <span className="font-bold text-slate-800">Hari Kerja Efektif Ditemukan:</span>{' '}
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {monthEffectiveDays.length} Hari Kerja
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  Hari Minggu &amp; Libur Semester dilewati
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Pilih Tanggal Presensi (Masa Lampau / Hari Ini)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Bisa digunakan untuk tanggal mundur/lampau yang terlewat.
                  </p>
                </div>
                <div className="shrink-0">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="bg-white border-2 border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Opsi Pengaturan Waktu & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Kehadiran */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Status Kehadiran
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as AttendanceStatus)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="Hadir">Hadir (Tepat Waktu)</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Dinas Luar">Dinas Luar</option>
              </select>
              <p className="text-[10px] text-slate-500">
                Status yang akan dicatatkan pada buku rekaman absensi.
              </p>
            </div>

            {/* Jam Masuk & Jam Pulang */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Jam Masuk &amp; Pulang
              </label>
              <select
                value={timeMode}
                onChange={(e) => setTimeMode(e.target.value as 'auto' | 'custom')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="auto">Otomatis Sesuai Jadwal Sekolah (Rekomendasi)</option>
                <option value="custom">Kustom Jam Tertentu</option>
              </select>
              <p className="text-[10px] text-slate-500">
                {timeMode === 'auto'
                  ? 'Jumat otomatis pulang jam 11:30/12:00, Senin-Kamis jam 14:00.'
                  : 'Gunakan jam manual yang Anda tentukan sendiri di bawah.'}
              </p>
            </div>
          </div>

          {/* Input Jam Kustom (Jika dipilih Kustom) */}
          {timeMode === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-2xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Jam Masuk (Format HH:mm)
                </label>
                <input
                  type="text"
                  value={customTimeIn}
                  onChange={(e) => setCustomTimeIn(e.target.value)}
                  placeholder="07:00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Jam Pulang (Format HH:mm)
                </label>
                <input
                  type="text"
                  value={customTimeOut}
                  onChange={(e) => setCustomTimeOut(e.target.value)}
                  placeholder="14:00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Pilihan Perlakuan Data (Timpa vs Hanya Isi yang Kosong) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Perlindungan Data yang Sudah Ada
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  overwriteMode === 'only_empty'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="overwriteMode"
                  checked={overwriteMode === 'only_empty'}
                  onChange={() => setOverwriteMode('only_empty')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-[11px] font-extrabold flex items-center gap-1.5">
                    <span>Hanya Isi yang Kosong</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-200 text-emerald-900 text-[9px] font-black">
                      Aman
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Tidak akan menimpa tanggal jika ada guru yang sebelumnya sudah izin, sakit, atau cuti.
                  </div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  overwriteMode === 'all'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="overwriteMode"
                  checked={overwriteMode === 'all'}
                  onChange={() => setOverwriteMode('all')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-[11px] font-extrabold">Perbarui / Timpa Semua Hari Kerja</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Menjadikan seluruh hari kerja sebagai Hadir penuh, menimpa catatan absensi lama.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Pemilihan Guru & Tenaga Kependidikan */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-800 text-xs">
                  Daftar Guru &amp; Tendik ({selectedTeacherIds.size}/{teachers.length})
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
              >
                {selectedTeacherIds.size === teachers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 p-2">
              {teachers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Belum ada data guru &amp; tenaga kependidikan terdaftar.
                </div>
              ) : (
                teachers.map((t, idx) => {
                  const isChecked = selectedTeacherIds.has(t.id);
                  return (
                    <label
                      key={t.id}
                      className="p-2 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTeacher(t.id)}
                          className="rounded-md border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-800 text-xs truncate">
                            {idx + 1}. {t.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {t.position || t.classRoom || 'Guru'} • NIP:{' '}
                            {t.nip || t.nis || 'Non-NIP'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        {t.employmentStatus || 'PTK'}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Ringkasan Eksekusi */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info text-amber-600"></i>
                <span>Ringkasan Presensi yang Akan Dibuat:</span>
              </div>
              <div className="text-[11px] text-amber-800 mt-1 space-y-0.5">
                <div>
                  • Guru Terpilih: <strong>{activeTeachers.length} Orang</strong>
                </div>
                <div>
                  • Hari Kerja: <strong>{previewStats.totalWorkDays} Hari</strong>
                </div>
                <div>
                  • Total Rekaman Presensi Baru:{' '}
                  <strong className="text-amber-900 font-black">
                    {previewStats.totalToProcess} Data
                  </strong>{' '}
                  ({previewStats.newRecordsCount} Baru, {previewStats.overwriteCount} Timpa)
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleExecuteQuickBulk}
                disabled={isProcessing || previewStats.totalToProcess === 0}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-amber-300"
              >
                {isProcessing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt"></i>
                    <span>⚡ Proses Absen Cepat Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {processProgress && (
            <div className="text-center text-[11px] font-bold text-amber-700 animate-pulse">
              {processProgress}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[10px]">
          <span>💡 Absen Cepat otomatis menyesuaikan jam pulang dan hari efektif sekolah.</span>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
