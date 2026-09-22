import React, { useState } from 'react';
import { AttendanceRecord, Guru, ScheduledLeave, SystemSettings } from '../types';
import { generateWADailySummaryMessage, openWADailySummary } from '../utils/whatsapp';
import { getDayScheduleForDate } from '../utils/scheduleUtils';

interface DailyWASummaryModalProps {
  date: string;
  teachers: Guru[];
  records: AttendanceRecord[];
  leaves?: ScheduledLeave[];
  settings: SystemSettings;
  onClose: () => void;
}

export const DailyWASummaryModal: React.FC<DailyWASummaryModalProps> = ({
  date,
  teachers,
  records,
  leaves = [],
  settings,
  onClose,
}) => {
  const [targetPhone, setTargetPhone] = useState(settings.whatsappTargetPhone || '');
  const [copied, setCopied] = useState(false);

  // Jadwal hari terkait
  const schedule = getDayScheduleForDate(date, settings);

  // Hasilkan teks pesan
  const summaryMessage = generateWADailySummaryMessage(
    date,
    teachers,
    records,
    leaves,
    settings
  );

  // Hitung ringkasan cepat
  const dailyRecords = records.filter((r) => r.date === date);
  const recordMap = new Map<string, AttendanceRecord>();
  dailyRecords.forEach((r) => {
    const id = r.guruId || r.studentId || r.nip || r.nis;
    if (id) recordMap.set(id, r);
  });

  const hadirCount = dailyRecords.filter((r) => r.status === 'Hadir').length;
  const lateCount = dailyRecords.filter((r) => r.status === 'Terlambat').length;
  const dinasCount = dailyRecords.filter((r) => r.status === 'Dinas Luar').length;
  const izinSakitCount = dailyRecords.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length;
  const totalProcessed = hadirCount + lateCount + dinasCount + izinSakitCount;
  const belumCount = Math.max(0, teachers.length - totalProcessed);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = summaryMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWA = () => {
    openWADailySummary(date, teachers, records, leaves, settings, targetPhone.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative space-y-4 my-8 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 cursor-pointer transition-colors"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
            <i className="fa-brands fa-whatsapp"></i>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Kirim Rekap Presensi Harian WhatsApp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kirim laporan kehadiran guru ke grup sekolah atau nomor Kepala Sekolah.
            </p>
          </div>
        </div>

        {/* Jadwal Hari Kerja Aktif Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/40 dark:to-sky-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
              <i className="fa-solid fa-calendar-day"></i>
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Hari {schedule.day} ({date})</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${schedule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {schedule.isActive ? 'Hari Kerja' : 'Hari Libur'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Batas Masuk: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{schedule.lateCutoffTime} WITA</strong>
                <span className="mx-1.5">•</span>
                Mulai Pulang: <strong className="text-slate-800 dark:text-slate-200 font-mono">{schedule.returnStartTime} WITA</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <div className="text-lg font-black text-slate-800 dark:text-slate-100">{teachers.length}</div>
            <div className="text-[10px] font-bold text-slate-500">Total Guru</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800">
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{hadirCount}</div>
            <div className="text-[10px] font-bold text-emerald-600">Tepat Waktu</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800">
            <div className="text-lg font-black text-amber-700 dark:text-amber-400">{lateCount}</div>
            <div className="text-[10px] font-bold text-amber-600">Terlambat</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-800">
            <div className="text-lg font-black text-blue-700 dark:text-blue-400">{dinasCount + izinSakitCount}</div>
            <div className="text-[10px] font-bold text-blue-600">Dinas / Izin</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-800 col-span-3 sm:col-span-1">
            <div className="text-lg font-black text-rose-700 dark:text-rose-400">{belumCount}</div>
            <div className="text-[10px] font-bold text-rose-600">Belum Absen</div>
          </div>
        </div>

        {/* Konfigurasi Nomor Tujuan WA */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <i className="fa-solid fa-phone text-emerald-600"></i>
              <span>Nomor WhatsApp Tujuan:</span>
            </label>
            <span className="text-[10px] text-slate-500">
              {settings.whatsappTargetName || 'Kepala Sekolah / Grup'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Contoh: 081234567890 (atau kosongkan untuk memilih kontak di WA)"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            {settings.whatsappTargetPhone && (
              <button
                type="button"
                onClick={() => setTargetPhone(settings.whatsappTargetPhone || '')}
                className="px-2.5 py-2 text-[11px] font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Gunakan nomor default dari pengaturan"
              >
                Reset Default
              </button>
            )}
          </div>
        </div>

        {/* Preview Format Pesan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Preview Format Pesan WhatsApp:
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <i className={copied ? 'fa-solid fa-check text-emerald-600' : 'fa-regular fa-copy'}></i>
              <span>{copied ? 'Tersalin!' : 'Salin Pesan'}</span>
            </button>
          </div>
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all border border-slate-800 shadow-inner">
            {summaryMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <i className={copied ? 'fa-solid fa-check text-emerald-600' : 'fa-regular fa-copy'}></i>
            <span>{copied ? 'Berhasil Disalin!' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendWA}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <i className="fa-brands fa-whatsapp text-sm"></i>
            <span>Buka & Kirim WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
