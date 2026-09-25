import React from 'react';
import { SystemSettings } from '../types';

interface OfficialSignaturesBlockProps {
  settings: SystemSettings;
  customDate?: string;
  selectedMonth?: string;
}

export const OfficialSignaturesBlock: React.FC<OfficialSignaturesBlockProps> = ({
  settings,
  customDate,
  selectedMonth,
}) => {
  const city = settings.signatureCity || settings.schoolCity || 'Palasa Lambori';
  const headName = settings.headmasterName || 'RAHMAT, S.Pd., M.Pd';
  const headNip = settings.headmasterNip || '19851204 200903 1 002';

  const korwilName = settings.korwilName || 'Drs. AGUSTAN, M.A.P';
  const korwilNip = settings.korwilNip || '19670807 199702 1 001';
  const korwilTitle = settings.korwilTitle || 'Koordinator Wilayah Satuan Pendidikan';
  const korwilKecamatan = settings.korwilKecamatan || 'Kecamatan Palasa';

  // Resolving signature date:
  // 1. If customDate is provided, use it.
  // 2. If selectedMonth (YYYY-MM) is provided, calculate the exact last day of that month (e.g. 31 Agustus 2026, 30 September 2026, etc.).
  // 3. Fallback to current date.
  const resolveSignatureDate = (): string => {
    if (customDate) return customDate;
    if (selectedMonth) {
      try {
        const [y, m] = selectedMonth.split('-').map(Number);
        if (y && m) {
          // day 0 of month m+1 is the last day of month m (since m in Date constructor is 0-indexed, new Date(y, m, 0) gives last day of month m)
          const lastDay = new Date(y, m, 0);
          return lastDay.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
      } catch {
        // fallback
      }
    }
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const todayFormatted = resolveSignatureDate();

  return (
    <div className="bg-white p-4 sm:p-6 text-slate-900 border-t border-slate-300 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-[11px]">
        {/* Left Box: Keterangan (Legend) */}
        <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/70 max-w-xs">
          <h5 className="font-black text-slate-900 uppercase text-[11px] mb-1.5 pb-1 border-b border-slate-300 flex items-center gap-1.5">
            <i className="fa-solid fa-circle-info text-red-800"></i>
            <span>KETERANGAN :</span>
          </h5>
          <div className="space-y-1 font-mono text-[10px] text-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-5 h-4 bg-red-100 text-red-900 font-bold border border-red-300 rounded-xs flex items-center justify-center text-[9px]">
                A
              </span>
              <span>: ALPA (TANPA KETERANGAN)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-4 bg-sky-100 text-sky-900 font-bold border border-sky-300 rounded-xs flex items-center justify-center text-[9px]">
                I
              </span>
              <span>: IZIN</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-4 bg-amber-100 text-amber-800 font-bold border border-amber-300 rounded-xs flex items-center justify-center text-[9px]">
                S
              </span>
              <span>: SAKIT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-4 bg-purple-100 text-purple-800 font-bold border border-purple-300 rounded-xs flex items-center justify-center text-[9px]">
                C
              </span>
              <span>: CUTI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-4 bg-blue-100 text-blue-800 font-bold border border-blue-300 rounded-xs flex items-center justify-center text-[9px]">
                DL
              </span>
              <span>: DINAS LUAR / TUGAS</span>
            </div>
          </div>
        </div>

        {/* Center: Mengetahui, Koordinator Wilayah (Korwil) */}
        <div className="text-center flex flex-col items-center justify-between min-h-[145px]">
          <div>
            <p className="font-semibold text-slate-700">Mengetahui,</p>
            <p className="font-black text-slate-900 uppercase tracking-tight">{korwilTitle}</p>
            <p className="font-bold text-slate-800 uppercase">{korwilKecamatan}</p>
          </div>

          <div className="pt-14 pb-1">
            <p className="font-black text-slate-950 uppercase tracking-tight underline text-[11.5px]">
              {korwilName}
            </p>
            <p className="font-mono text-[10px] text-slate-700">
              NIP. {korwilNip}
            </p>
          </div>
        </div>

        {/* Right: Kepala Sekolah */}
        <div className="text-center flex flex-col items-center justify-between min-h-[145px]">
          <div>
            <p className="font-semibold text-slate-700">
              {city}, {todayFormatted}
            </p>
            <p className="font-black text-slate-900 uppercase tracking-tight">Kepala Sekolah</p>
            <p className="font-bold text-slate-800 uppercase">{settings.schoolName || 'SDN Kecil Ogomojolo'}</p>
          </div>

          <div className="pt-14 pb-1">
            <p className="font-black text-slate-950 uppercase tracking-tight underline text-[11.5px]">
              {headName}
            </p>
            <p className="font-mono text-[10px] text-slate-700">
              NIP. {headNip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
