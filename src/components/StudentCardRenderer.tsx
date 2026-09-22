import React, { useState, useEffect } from 'react';
import { CardTemplateId, Student, SystemSettings } from '../types';
import { CardCustomizationOptions } from '../utils/cardCustomization';
import { TutWuriHandayaniLogo } from './TutWuriHandayaniLogo';
import { createKepsekSignatureQRPayload, generateQRCodeDataURL } from '../utils/qr';

interface StudentCardRendererProps {
  student: Student;
  settings: SystemSettings;
  options: CardCustomizationOptions;
  qrUrl?: string;
  photoUrl?: string;
  kepsekQrUrl?: string;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showCheckbox?: boolean;
}

export const StudentCardRenderer: React.FC<StudentCardRendererProps> = ({
  student,
  settings,
  options,
  qrUrl,
  photoUrl,
  kepsekQrUrl: externalKepsekQrUrl,
  isSelected = true,
  onToggleSelect,
  showCheckbox = false,
}) => {
  const [internalKepsekQr, setInternalKepsekQr] = useState<string>('');

  useEffect(() => {
    if (!externalKepsekQrUrl) {
      const payload = createKepsekSignatureQRPayload(settings);
      generateQRCodeDataURL(payload).then(setInternalKepsekQr);
    }
  }, [settings.schoolName, settings.headmasterName, settings.headmasterNip, settings.academicYear, externalKepsekQrUrl]);

  const effectiveKepsekQr = externalKepsekQrUrl || internalKepsekQr;

  const rawTpl = options.templateId || settings.defaultCardTemplate || 'emerald_gold';
  let activeTemplate: CardTemplateId = rawTpl;
  if (rawTpl === 'seraphic') activeTemplate = 'navy_gold';
  if (rawTpl === 'nusantara') activeTemplate = 'emerald_gold';
  if (rawTpl === 'pelita') activeTemplate = 'modern_minimalis';

  const photoSrc = photoUrl || student.photo || student.avatarUrl;
  const finalSchoolName = (settings.schoolName || 'SDK OGOMOJOLO').toUpperCase();
  const schoolCity = settings.schoolCity || 'Tolitoli';
  const schoolRegency = settings.schoolRegency || (settings.schoolCity ? `PEMERINTAH KABUPATEN ${settings.schoolCity.toUpperCase()}` : 'PEMERINTAH KABUPATEN TOLITOLI');
  const schoolDepartment = settings.schoolDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN';
  
  let cardTitle = settings.cardTitle || 'KARTU IDENTITAS GURU & PRESENSI DIGITAL';
  if (/siswa|pelajar/i.test(cardTitle)) {
    cardTitle = 'KARTU IDENTITAS GURU & PRESENSI DIGITAL';
  }
  
  let cardValidityText = settings.cardValidityText || 'KARTU RESMI GURU • BERLAKU SELAMA BERTUGAS';
  if (/siswa|pelajar/i.test(cardValidityText)) {
    cardValidityText = 'KARTU RESMI GURU • BERLAKU SELAMA BERTUGAS';
  }

  const headmasterName = settings.headmasterName || 'Drs. H. Mulyadi, M.Pd';
  const rawNip = settings.headmasterNip || '19680512 199403 1 005';
  const headmasterNip = rawNip.startsWith('NIP') ? rawNip : `NIP. ${rawNip}`;
  const academicYear = settings.academicYear || '2025/2026';

  const isEmerald = activeTemplate === 'emerald_gold';
  const isModern = activeTemplate === 'modern_minimalis';

  const headerBgClass = isEmerald ? 'bg-[#032d22]' : isModern ? 'bg-[#1e293b]' : 'bg-[#0f2b5c]';
  const accentBorderColor = isEmerald ? '#f59e0b' : isModern ? '#2563eb' : '#c59b27';
  const accentTextClass = isEmerald ? 'text-amber-300' : isModern ? 'text-blue-400' : 'text-[#c59b27]';
  const primaryTextClass = isEmerald ? 'text-[#064e3b]' : isModern ? 'text-slate-900' : 'text-[#0f2b5c]';
  const logoVariant: 'blue_gold' | 'green_gold' | 'official' = isEmerald ? 'green_gold' : isModern ? 'official' : 'blue_gold';

  // Extract Teacher / PTK attributes
  const nipDisplay = student.nip || student.nis || '-';
  const nuptkDisplay = student.nuptk || student.nisn || '-';
  const positionDisplay = student.position || student.subject || student.classRoom || 'Guru / Tenaga Pendidik';
  const employmentStatus = student.employmentStatus || 'Guru Aktif';

  // Signature presentation mode: 'none' (Fokus Barcode Absen Penuh) | 'qr_digital' | 'signature_stamp' | 'both'
  const signatureMode = options.signatureType !== undefined
    ? options.signatureType
    : (settings.headmasterSignatureType || 'none');

  return (
    <div
      id={`student-card-${student.id}`}
      className="card-item relative bg-white border border-slate-300 shadow-md transition-all select-none mx-auto overflow-hidden flex flex-col justify-between"
      style={{
        width: '276px',
        minHeight: '438px',
        maxHeight: '438px',
        aspectRatio: '53.98 / 85.6',
        borderRadius: '14px',
      }}
    >
      {/* Checkbox Selector for toggling on-screen (Non-Printable) */}
      {showCheckbox && onToggleSelect && (
        <button
          type="button"
          onClick={onToggleSelect}
          className="absolute top-2.5 right-2.5 z-40 w-6 h-6 rounded-lg bg-white/95 border border-slate-300 flex items-center justify-center text-xs cursor-pointer shadow-md no-print hover:bg-white transition-transform active:scale-95"
          title={isSelected ? 'Batalkan cetak kartu ini' : 'Pilih kartu ini'}
        >
          {isSelected && <i className="fa-solid fa-check font-black text-emerald-600"></i>}
        </button>
      )}

      {/* Top Tricolor Lanyard Guide */}
      <div className="flex justify-center pt-1.5 pb-1 bg-slate-100/80 border-b border-slate-200">
        <div className="w-16 h-2 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center gap-1">
          <div className="w-2 h-1 rounded-full bg-rose-500"></div>
          <div className="w-2 h-1 rounded-full bg-amber-400"></div>
          <div className="w-2 h-1 rounded-full bg-emerald-500"></div>
        </div>
      </div>

      {/* Card Header: Official Indonesian School Banner with Left Logo & Right School Logo */}
      <div
        className={`${headerBgClass} text-white px-2.5 py-2 relative border-b-2 shadow-sm`}
        style={{ borderColor: accentBorderColor }}
      >
        <div className="flex items-center gap-2">
          {/* Logo Kiri: Tut Wuri Handayani / Pemda */}
          <div className="shrink-0 p-0.5 bg-white/10 rounded-full border border-white/20">
            {settings.logoKabupatenUrl ? (
              <img
                src={settings.logoKabupatenUrl}
                alt="Logo Pemda"
                className="w-7 h-7 object-contain rounded-full bg-white/90 p-0.5"
                referrerPolicy="no-referrer"
              />
            ) : (
              <TutWuriHandayaniLogo size={28} variant={logoVariant} />
            )}
          </div>

          {/* Institutional Information */}
          <div className="leading-tight min-w-0 flex-1">
            <span className="text-[6.5px] font-semibold text-slate-200 uppercase tracking-wide block truncate">
              {schoolRegency}
            </span>
            <span className={`text-[7px] font-bold ${accentTextClass} uppercase tracking-wider block truncate`}>
              {schoolDepartment}
            </span>
            <h4 className="font-black text-[10px] tracking-wide text-white uppercase truncate leading-tight mt-0.5">
              {finalSchoolName}
            </h4>
            <span className="text-[7px] font-bold text-amber-300/90 uppercase tracking-tight block truncate">
              {cardTitle}
            </span>
          </div>

          {/* Logo Kanan: Logo Resmi Sekolah */}
          <div className="shrink-0 p-0.5 bg-white/15 rounded-lg border border-white/30 shadow-xs flex items-center justify-center">
            {settings.logoSekolahUrl ? (
              <img
                src={settings.logoSekolahUrl}
                alt="Logo Sekolah"
                className="w-7 h-7 object-contain rounded bg-white/95 p-0.5"
                referrerPolicy="no-referrer"
              />
            ) : settings.logoDinasUrl ? (
              <img
                src={settings.logoDinasUrl}
                alt="Logo Dinas/Sekolah"
                className="w-7 h-7 object-contain rounded bg-white/95 p-0.5"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-7 h-7 rounded bg-white/95 flex flex-col items-center justify-center text-slate-800 shadow-xs"
                title="Logo Sekolah"
              >
                <i className="fa-solid fa-school text-emerald-800 text-[11px]"></i>
                <span className="text-[5px] font-black text-emerald-950 leading-none">SDK</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Body: Teacher Photo & Official Biodata */}
      <div className="px-3 pt-2 pb-1 flex-1 flex flex-col justify-between">
        {/* Upper Info Row */}
        <div className="flex gap-2.5 items-start">
          {/* Passport Photo 3:4 */}
          <div className="shrink-0">
            <div
              className="w-[84px] h-[106px] rounded-lg overflow-hidden bg-slate-50 border-2 flex items-center justify-center shadow-sm relative"
              style={{ borderColor: accentBorderColor }}
            >
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={student.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                  <i className="fa-solid fa-user-tie text-2xl text-slate-400 mb-1"></i>
                  <span className="text-[7.5px] font-bold text-slate-500 uppercase">FOTO GURU</span>
                  <span className="text-[6.5px] text-slate-400">3 x 4 cm</span>
                </div>
              )}
            </div>
          </div>

          {/* Structured Biodata Table */}
          <div className="flex-1 min-w-0 text-left">
            <div className="border-b border-slate-200 pb-1 mb-1">
              <span className="text-[7px] font-bold text-slate-400 tracking-wider uppercase block">
                NAMA GURU
              </span>
              <h5 className={`font-black text-[10.5px] ${primaryTextClass} uppercase leading-tight line-clamp-2 tracking-tight`}>
                {student.name}
              </h5>
            </div>

            <div className="space-y-1 text-[8px] pt-0.5">
              <div className="flex items-baseline">
                <span className="w-[66px] shrink-0 text-slate-500 font-medium text-[8px]">NIP</span>
                <span className="w-[8px] text-slate-400 font-bold text-[8px] text-center">:</span>
                <span className="font-mono font-bold text-slate-800 text-[8.5px] truncate flex-1 min-w-0" title={nipDisplay}>
                  {nipDisplay}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-[66px] shrink-0 text-slate-500 font-medium text-[8px]">NUPTK</span>
                <span className="w-[8px] text-slate-400 font-bold text-[8px] text-center">:</span>
                <span className="font-mono font-bold text-slate-800 text-[8.5px] truncate flex-1 min-w-0" title={nuptkDisplay}>
                  {nuptkDisplay}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-[66px] shrink-0 text-slate-500 font-medium text-[8px]">Jabatan</span>
                <span className="w-[8px] text-slate-400 font-bold text-[8px] text-center">:</span>
                <span className="font-bold text-slate-900 text-[8px] truncate flex-1 min-w-0" title={positionDisplay}>
                  {positionDisplay}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-[66px] shrink-0 text-slate-500 font-medium text-[7.5px] leading-tight">Berlaku sampai</span>
                <span className="w-[8px] text-slate-400 font-bold text-[8px] text-center leading-tight">:</span>
                <span className="font-semibold text-slate-700 text-[7px] leading-snug flex-1 min-w-0">
                  selama menjabat disekolah ini
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="my-1.5 border-t border-dashed border-slate-200"></div>

        {/* Lower Row: Full Barcode Absen (Fokus Presensi) vs Pengesahan Kepala Sekolah */}
        {signatureMode === 'none' ? (
          <div className="flex flex-col items-center justify-center my-auto py-1">
            {/* Full Attendance Barcode Box */}
            <div
              className="p-1.5 bg-white rounded-xl border-2 shadow-xs flex items-center justify-center transition-transform hover:scale-105"
              style={{ borderColor: accentBorderColor }}
            >
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Absensi ${student.name}`}
                  className="w-[94px] h-[94px] rounded object-contain"
                />
              ) : (
                <div className="w-[94px] h-[94px] bg-slate-100 flex flex-col items-center justify-center text-[10px] text-slate-400 font-bold">
                  <i className="fa-solid fa-qrcode text-2xl mb-1 text-slate-400"></i>
                  <span>QR Presensi</span>
                </div>
              )}
            </div>

            {/* Attendance Scanner Instructions & Guru Badge */}
            <div className="text-center mt-1.5 space-y-0.5">
              <span className="text-[7.5px] font-black text-slate-800 tracking-wider uppercase block">
                PINDAI UNTUK PRESENSI
              </span>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                <span className="text-[7px] font-mono font-bold text-slate-700">
                  ID GURU: {nipDisplay}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 2-Kolom: QR Presensi + Pengesahan Kepala Sekolah */
          <div className="flex items-center justify-between gap-2 px-0.5">
            {/* QR Code Container (Guru Attendance QR) */}
            <div className="flex flex-col items-center shrink-0">
              <div className="p-1 bg-white rounded-lg border border-slate-300 shadow-xs">
                {qrUrl ? (
                  <img src={qrUrl} alt={`QR ${student.name}`} className="w-[62px] h-[62px] rounded" />
                ) : (
                  <div className="w-[62px] h-[62px] bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                    QR Guru
                  </div>
                )}
              </div>
              <span className="text-[6.5px] font-extrabold text-slate-600 tracking-wider uppercase mt-0.5">
                PINDAI PRESENSI
              </span>
            </div>

            {/* Pengesahan Kepala Sekolah: QR Code TTD Digital / Stempel / TTD Basah */}
            <div className="flex-1 text-center relative py-0.5 pl-1">
              <p className="text-[7px] text-slate-500 font-medium truncate">
                {schoolCity}, {academicYear}
              </p>
              <p className="text-[7.5px] font-bold text-slate-800 leading-tight">
                Kepala Sekolah,
              </p>

              {/* Signature Area */}
              <div className="relative h-11 flex items-center justify-center my-0.5">
                {/* Tanda Tangan Kepsek: QR Code Digital vs Gambar TTD vs Cursive */}
                {signatureMode === 'qr_digital' ? (
                  <div className="z-10 flex flex-col items-center justify-center">
                    <div className="p-0.5 bg-white rounded border border-emerald-600/40 shadow-xs">
                      {effectiveKepsekQr ? (
                        <img src={effectiveKepsekQr} alt="QR TTD Kepsek" className="w-[34px] h-[34px]" />
                      ) : (
                        <div className="w-[34px] h-[34px] bg-slate-100 flex items-center justify-center text-[6px]">TTE</div>
                      )}
                    </div>
                    <span className="text-[5.5px] font-black text-emerald-800 tracking-tighter leading-none mt-0.5">
                      TTE DIGITAL KEPSEK
                    </span>
                  </div>
                ) : signatureMode === 'both' ? (
                  <div className="z-10 flex items-center justify-center gap-1.5 w-full">
                    <div className="p-0.5 bg-white rounded border border-emerald-600/40 shadow-xs shrink-0">
                      {effectiveKepsekQr ? (
                        <img src={effectiveKepsekQr} alt="QR TTD Kepsek" className="w-[28px] h-[28px]" />
                      ) : (
                        <div className="w-[28px] h-[28px] bg-slate-100 flex items-center justify-center text-[5.5px]">TTE</div>
                      )}
                    </div>
                    {settings.headmasterSignatureUrl ? (
                      <img
                        src={settings.headmasterSignatureUrl}
                        alt="TTD Kepsek"
                        className="h-8 max-w-[55px] object-contain"
                      />
                    ) : (
                      <svg className="w-16 h-7 text-emerald-950" viewBox="0 0 100 40" fill="none">
                        <path
                          d="M10 28 C20 10, 25 35, 38 12 C45 32, 55 15, 68 25 C78 20, 85 28, 92 18 M15 32 L88 30"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                ) : settings.headmasterSignatureUrl ? (
                  <img
                    src={settings.headmasterSignatureUrl}
                    alt="TTD Kepsek"
                    className="h-9 max-w-[80px] object-contain z-10"
                  />
                ) : (
                  <svg className="w-24 h-7 text-emerald-950 z-10" viewBox="0 0 100 40" fill="none">
                    <path
                      d="M10 28 C20 10, 25 35, 38 12 C45 32, 55 15, 68 25 C78 20, 85 28, 92 18 M15 32 L88 30"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Underlined Headmaster Name & NIP */}
              <div className="leading-tight mt-0.5">
                <span className="text-[8px] font-black text-slate-900 uppercase underline decoration-slate-800 tracking-tight block truncate" title={headmasterName}>
                  {headmasterName}
                </span>
                <span className="text-[6.5px] text-slate-500 font-mono block truncate" title={headmasterNip}>
                  {headmasterNip}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Ribbon with Merah-Kuning-Hijau accent */}
      <div
        className={`${headerBgClass} text-white py-1 px-2 text-center border-t relative overflow-hidden`}
        style={{ borderColor: accentBorderColor }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"></div>
        <p className="text-[7px] font-bold tracking-wider text-slate-100 uppercase truncate">
          {cardValidityText}
        </p>
      </div>
    </div>
  );
};
