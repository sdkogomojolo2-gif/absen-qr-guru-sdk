import React, { useState, useEffect } from 'react';
import { Guru, AttendanceStatus, AttendanceRecord, Teacher, SystemSettings } from '../types';
import { getDayScheduleForDate, getScheduledEntryTimeForDate } from '../utils/scheduleUtils';

interface RetroactiveAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Guru[];
  selectedDate?: string;
  preselectedTeacherId?: string;
  initialDate?: string;
  initialTeacherId?: string;
  currentTeacher?: Teacher | null;
  onSaveAttendance: (record: AttendanceRecord) => void;
  schoolId?: string;
  existingRecord?: AttendanceRecord | null;
  settings?: SystemSettings;
}

export const RetroactiveAttendanceModal: React.FC<RetroactiveAttendanceModalProps> = ({
  isOpen,
  onClose,
  teachers,
  selectedDate,
  preselectedTeacherId,
  initialDate,
  initialTeacherId,
  currentTeacher,
  onSaveAttendance,
  schoolId,
  existingRecord,
  settings,
}) => {
  const effectiveInitialDate = selectedDate || initialDate;

  const [teacherId, setTeacherId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [status, setStatus] = useState<AttendanceStatus>('Hadir');
  const [timeIn, setTimeIn] = useState<string>('07:00');
  const [timeOut, setTimeOut] = useState<string>('14:00');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick reasons suggestions
  const quickReasons = [
    'Lupa scan saat tiba di sekolah',
    'Tugas dinas luar / rapat dinas',
    'Jaringan internet sekolah sempat kendala',
    'Mengikuti pelatihan / workshop PTK',
    'Terburu-buru jadwal piket pagi',
    'Izin keperluan dinas mendadak',
  ];

  useEffect(() => {
    if (isOpen) {
      const initDate = effectiveInitialDate || new Date().toISOString().slice(0, 10);
      setDate(initDate);

      // Resolve valid teacher ID from available teachers list
      let targetTeacherId = '';
      if (preselectedTeacherId && teachers.some((t) => t.id === preselectedTeacherId)) {
        targetTeacherId = preselectedTeacherId;
      } else if (initialTeacherId && teachers.some((t) => t.id === initialTeacherId)) {
        targetTeacherId = initialTeacherId;
      } else if (currentTeacher) {
        const matched = teachers.find(
          (t) =>
            t.id === currentTeacher.id ||
            (t.nip && currentTeacher.nip && t.nip.replace(/\s+/g, '') === currentTeacher.nip.replace(/\s+/g, '')) ||
            t.name.toLowerCase() === currentTeacher.name.toLowerCase()
        );
        if (matched) targetTeacherId = matched.id;
      }

      if (!targetTeacherId && teachers.length > 0) {
        targetTeacherId = teachers[0].id;
      }

      setTeacherId(targetTeacherId);

      const schedule = getDayScheduleForDate(initDate, settings);
      const defaultTimeIn = getScheduledEntryTimeForDate(initDate, settings);
      const defaultTimeOut = schedule.returnStartTime || '14:00';

      if (existingRecord) {
        setStatus(existingRecord.status || 'Hadir');
        setTimeIn(existingRecord.timeIn || existingRecord.time || defaultTimeIn);
        setTimeOut(existingRecord.timeOut || defaultTimeOut);
        setNote(existingRecord.note || '');
      } else {
        setStatus('Hadir');
        setTimeIn(defaultTimeIn);
        setTimeOut(defaultTimeOut);
        setNote('');
      }
    }
  }, [isOpen, effectiveInitialDate, preselectedTeacherId, initialTeacherId, existingRecord, settings]);

  if (!isOpen) return null;

  const selectedTeacher = teachers.find((t) => t.id === teacherId) || teachers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !date) {
      alert('Mohon pilih nama guru dan tanggal presensi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetGuru = teachers.find((t) => t.id === teacherId) || teachers[0];
      if (!targetGuru) {
        alert('Data guru tidak ditemukan. Mohon pilih kembali guru dari daftar.');
        return;
      }

      // Sanitize ID strictly matching ^[a-zA-Z0-9_\-\.]+$ without spaces
      const cleanGuruId = (targetGuru.id || 'guru').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanDate = date.replace(/[^a-zA-Z0-9_-]/g, '');
      const recordId = existingRecord?.id || `att-retro-${cleanDate}-${cleanGuruId}-${Date.now()}`;

      const record: AttendanceRecord = {
        id: recordId,
        schoolId: schoolId || targetGuru.schoolId || 'sdk-ogomojolo',
        guruId: targetGuru.id,
        studentId: targetGuru.id,
        nip: targetGuru.nip || targetGuru.nis || '',
        nis: targetGuru.nip || targetGuru.nis || '',
        guruName: targetGuru.name,
        studentName: targetGuru.name,
        position: targetGuru.position || targetGuru.classRoom || 'Guru',
        classRoom: targetGuru.position || targetGuru.classRoom || 'Guru',
        employmentStatus: targetGuru.employmentStatus || 'PTK',
        date,
        time: timeIn || '07:00:00',
        timeIn: timeIn || '07:00',
        timeOut: status === 'Hadir' || status === 'Terlambat' || status === 'Dinas Luar' ? timeOut : undefined,
        status,
        note: note.trim() || `Presensi Susulan (${status})`,
        scannedVia: 'Manual Input',
      };

      onSaveAttendance(record);
      onClose();
    } catch (err: any) {
      console.error('Gagal menyimpan absensi susulan:', err);
      alert(`Gagal menyimpan absensi susulan: ${err?.message || 'Terjadi kendala data'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick date helpers
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-[#03241b] border-2 border-amber-500/50 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon (Merah - Kuning - Hijau) */}
        <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#0d5947] flex items-center justify-between bg-[#021c15]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg shadow-inner">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Absen Masa Lampau / Lupa Absen
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Koreksi Rekap
                </span>
              </h3>
              <p className="text-xs text-emerald-200/70">
                Catat presensi susulan untuk guru yang lupa scan pada tanggal tertentu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Guru Selector */}
          <div>
            <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1.5">
              Pilih Guru / Tenaga Kependidikan <span className="text-rose-400">*</span>
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full bg-[#043328] border border-[#0d5947] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm focus:outline-none transition-colors"
              required
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#03241b] text-white">
                  {t.name} {t.nip ? `(NIP: ${t.nip})` : ''} - {t.position || 'Guru'} [{t.employmentStatus || 'PTK'}]
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Summary Badge */}
          {selectedTeacher && (
            <div className="p-3 bg-[#021c15] border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800/60 border border-emerald-500/40 flex items-center justify-center font-bold text-amber-300">
                  <i className="fa-solid fa-user-check"></i>
                </div>
                <div>
                  <span className="font-bold text-white block">{selectedTeacher.name}</span>
                  <span className="text-emerald-300/80 text-[11px]">
                    {selectedTeacher.position || 'Guru'} • Status: {selectedTeacher.employmentStatus || 'PTK'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] border border-amber-400/30">
                NIP: {selectedTeacher.nip || selectedTeacher.nis || '-'}
              </span>
            </div>
          )}

          {/* Tanggal Presensi Susulan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                Tanggal Absensi (Masa Lampau) <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2 py-0.5 rounded bg-[#043328] hover:bg-emerald-700/50 text-emerald-200 border border-emerald-600/40"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2 py-0.5 rounded bg-[#043328] hover:bg-emerald-700/50 text-emerald-200 border border-emerald-600/40"
                >
                  Kemarin
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="px-2 py-0.5 rounded bg-[#043328] hover:bg-emerald-700/50 text-emerald-200 border border-emerald-600/40"
                >
                  2 Hari Lalu
                </button>
              </div>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#043328] border border-[#0d5947] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Status Kehadiran */}
          <div>
            <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1.5">
              Status Kehadiran <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['Hadir', 'Terlambat', 'Dinas Luar', 'Izin', 'Sakit', 'Alpa'] as AttendanceStatus[]).map((st) => {
                const isActive = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center ${
                      isActive
                        ? st === 'Hadir'
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                          : st === 'Terlambat'
                          ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                          : st === 'Dinas Luar'
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                          : st === 'Izin'
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                          : st === 'Sakit'
                          ? 'bg-yellow-600 border-yellow-400 text-white shadow-md'
                          : 'bg-rose-600 border-rose-400 text-white shadow-md'
                        : 'bg-[#043328] border-emerald-700/40 text-emerald-200 hover:bg-emerald-800/40'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jam Masuk & Jam Pulang (Only relevant for Hadir / Terlambat / Dinas Luar) */}
          {(status === 'Hadir' || status === 'Terlambat' || status === 'Dinas Luar') && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1.5">
                  Jam Masuk / Datang
                </label>
                <input
                  type="time"
                  value={timeIn}
                  onChange={(e) => setTimeIn(e.target.value)}
                  className="w-full bg-[#043328] border border-[#0d5947] focus:border-amber-400 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-sm focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1.5">
                  Jam Pulang / Keluar
                </label>
                <input
                  type="time"
                  value={timeOut}
                  onChange={(e) => setTimeOut(e.target.value)}
                  className="w-full bg-[#043328] border border-[#0d5947] focus:border-amber-400 rounded-xl px-3.5 py-2 text-white font-mono font-bold text-sm focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Keterangan / Alasan Lupa Absen */}
          <div>
            <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1.5">
              Keterangan / Alasan Susulan
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Lupa scan saat piket pagi / Kegiatan dinas di luar sekolah"
              className="w-full bg-[#043328] border border-[#0d5947] focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-white placeholder-emerald-400/40 text-sm focus:outline-none transition-colors"
            />
            {/* Quick Reason Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(reason)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-[#021c15] text-emerald-300/80 hover:text-amber-300 hover:bg-emerald-900/40 border border-emerald-800/60 transition-colors"
                >
                  + {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#0d5947] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-emerald-700/50 text-emerald-200 hover:bg-emerald-800/30 font-medium text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-[#021c15] font-extrabold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className="fa-solid fa-check font-black"></i>
              Simpan Presensi Susulan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
