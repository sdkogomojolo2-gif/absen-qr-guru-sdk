import React from 'react';
import { ParigiMoutongLogo } from './ParigiMoutongLogo';
import { TutWuriHandayaniLogo } from './TutWuriHandayaniLogo';

interface OfficialReportKopProps {
  schoolName: string;
  nss: string;
  npsn: string;
  schoolAddress: string;
  monthLabel: string;
  countKS: number;
  countGuru: number;
  countTU: number;
  selectedStatusFilter: string;
  schoolRegency?: string;
  schoolDepartment?: string;
  logoKabupatenUrl?: string;
  logoDinasUrl?: string;
  onOpenLogoSettings?: () => void;
}

export const OfficialReportKop: React.FC<OfficialReportKopProps> = ({
  schoolName,
  nss,
  npsn,
  schoolAddress,
  monthLabel,
  countKS,
  countGuru,
  countTU,
  selectedStatusFilter,
  schoolRegency = 'PEMERINTAH KABUPATEN PARIGI MOUTONG',
  schoolDepartment = 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  logoKabupatenUrl,
  logoDinasUrl,
  onOpenLogoSettings,
}) => {
  const statusLabel =
    selectedStatusFilter === 'Semua'
      ? 'SEMUA STATUS (PNS, P3K & HONORER)'
      : selectedStatusFilter.toUpperCase();

  return (
    <div className="bg-white text-slate-900 p-4 sm:p-6 select-none relative group">
      {/* Quick Action Button to Open Logo Settings (Hidden on physical print) */}
      {onOpenLogoSettings && (
        <div className="absolute top-2 right-2 print:hidden">
          <button
            type="button"
            onClick={onOpenLogoSettings}
            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Klik untuk mengganti logo Kabupaten atau Dinas / Sekolah"
          >
            <i className="fa-solid fa-image text-red-700"></i>
            <span>Atur / Ganti Logo</span>
          </button>
        </div>
      )}

      {/* Official Government Header with Dual Crests */}
      <div className="flex items-center justify-between gap-3 sm:gap-6 pb-2">
        {/* Left Crest: Lambang Kabupaten (Custom Image or Default Parigi Moutong) */}
        <div
          onClick={onOpenLogoSettings}
          className={`shrink-0 flex items-center justify-center ${onOpenLogoSettings ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
          title={onOpenLogoSettings ? 'Klik untuk mengganti logo' : undefined}
        >
          {logoKabupatenUrl ? (
            <img
              src={logoKabupatenUrl}
              alt="Logo Kabupaten"
              className="h-[72px] w-auto max-w-[85px] object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ParigiMoutongLogo size={70} className="drop-shadow-xs" />
          )}
        </div>

        {/* Center Official Title */}
        <div className="flex-1 text-center space-y-0.5 px-2">
          <h2 className="text-[13px] sm:text-[15px] font-black tracking-tight text-slate-900 uppercase leading-snug">
            DAFTAR KONTROL KEHADIRAN GURU / TATA USAHA DAN PENJAGA SEKOLAH
          </h2>
          <h3 className="text-[12px] sm:text-[13.5px] font-black tracking-tight text-slate-800 uppercase leading-snug">
            DILINGKUNGAN {schoolDepartment} {schoolRegency ? schoolRegency.replace('PEMERINTAH ', '') : 'KAB.PARIGI MOUTONG'}
          </h3>
          <h4 className="text-[12px] sm:text-[13px] font-black tracking-wider text-slate-900 uppercase pt-0.5">
            BULAN : {monthLabel.toUpperCase()}
          </h4>
        </div>

        {/* Right Crest: Logo Dinas / Tut Wuri Handayani / Sekolah */}
        <div
          onClick={onOpenLogoSettings}
          className={`shrink-0 flex items-center justify-center ${onOpenLogoSettings ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
          title={onOpenLogoSettings ? 'Klik untuk mengganti logo' : undefined}
        >
          {logoDinasUrl ? (
            <img
              src={logoDinasUrl}
              alt="Logo Dinas / Sekolah"
              className="h-[72px] w-auto max-w-[85px] object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <TutWuriHandayaniLogo size={70} variant="official" className="drop-shadow-xs" />
          )}
        </div>
      </div>

      {/* Official Double Border Line (Indonesian Government Standard) */}
      <div className="mt-1 mb-3">
        <div className="h-[2.5px] bg-black w-full"></div>
        <div className="h-[1px] bg-black w-full mt-[2px]"></div>
      </div>

      {/* School Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-[11px] font-mono text-slate-900 pt-1">
        {/* Left Column */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-28 font-bold shrink-0">NAMA SEKOLAH</span>
            <span className="font-semibold">: {schoolName.toUpperCase()}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold shrink-0">NSS / NPSN</span>
            <span className="font-semibold">: {nss} / {npsn}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-bold shrink-0">ALAMAT</span>
            <span className="font-semibold">: {schoolAddress}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-36 font-bold shrink-0">JUMLAH KS</span>
            <span className="font-semibold">: {countKS} Orang</span>
          </div>
          <div className="flex">
            <span className="w-36 font-bold shrink-0">JUMLAH GURU</span>
            <span className="font-semibold">: {countGuru} Orang</span>
          </div>
          <div className="flex">
            <span className="w-36 font-bold shrink-0">JUMLAH TU / PENJAGA</span>
            <span className="font-semibold">: {countTU} Orang</span>
          </div>
          <div className="flex">
            <span className="w-36 font-bold shrink-0 text-slate-900">FILTER STATUS</span>
            <span className="font-black text-red-950">: {statusLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
