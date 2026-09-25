import React, { useState, useRef } from 'react';
import { Teacher, SystemSettings, WorkDaySchedule } from '../types';
import { compressLogoImage } from '../utils/imageCompressor';
import { DEFAULT_DAILY_SCHEDULES } from '../utils/scheduleUtils';
import { ParigiMoutongLogo } from './ParigiMoutongLogo';
import { TutWuriHandayaniLogo } from './TutWuriHandayaniLogo';

interface AdminProfileModalProps {
  currentTeacher: Teacher;
  settings: SystemSettings;
  onUpdateTeacher: (updated: Teacher) => void;
  onUpdateSettings: (updated: SystemSettings) => void;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  currentTeacher,
  settings,
  onUpdateTeacher,
  onUpdateSettings,
  onClose,
}) => {
  // Admin Data Form
  const [name, setName] = useState(currentTeacher.name);
  const [nip, setNip] = useState(currentTeacher.nip || '');
  const [email, setEmail] = useState(currentTeacher.email);
  const [pin, setPin] = useState(currentTeacher.pin || '1234');
  const [subject, setSubject] = useState(currentTeacher.subject);

  // School & Headmaster Data Form (for official reports / signature)
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [schoolCity, setSchoolCity] = useState(settings.schoolCity || 'Jakarta Selatan');
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [lateCutoffTime, setLateCutoffTime] = useState(settings.lateCutoffTime);
  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName || 'RAHMAT, S.Pd., M.Pd');
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '19851204 200903 1 002');
  const [korwilName, setKorwilName] = useState(settings.korwilName || 'Drs. AGUSTAN, M.A.P');
  const [korwilNip, setKorwilNip] = useState(settings.korwilNip || '19670807 199702 1 001');
  const [korwilTitle, setKorwilTitle] = useState(settings.korwilTitle || 'Koordinator Wilayah Satuan Pendidikan');
  const [korwilKecamatan, setKorwilKecamatan] = useState(settings.korwilKecamatan || 'Kecamatan Palasa');
  const [signatureCity, setSignatureCity] = useState(settings.signatureCity || 'Palasa Lambori');
  const [logoKabupatenUrl, setLogoKabupatenUrl] = useState<string | undefined>(settings.logoKabupatenUrl);
  const [logoDinasUrl, setLogoDinasUrl] = useState<string | undefined>(settings.logoDinasUrl);
  const [logoSekolahUrl, setLogoSekolahUrl] = useState<string | undefined>(settings.logoSekolahUrl);
  const [headmasterSignatureUrl, setHeadmasterSignatureUrl] = useState<string | undefined>(settings.headmasterSignatureUrl);
  const [headmasterSignatureType, setHeadmasterSignatureType] = useState<'none' | 'qr_digital' | 'signature_stamp' | 'both'>(
    settings.headmasterSignatureType || 'none'
  );

  // Work Day Schedule (Senin-Kamis, Jumat, Sabtu)
  const [dailySchedules, setDailySchedules] = useState<{ [dayIndex: number]: WorkDaySchedule }>(
    settings.dailySchedules || DEFAULT_DAILY_SCHEDULES
  );
  const [entryTimeMode, setEntryTimeMode] = useState<'cutoff' | 'entry' | 'realtime'>(
    settings.entryTimeMode || 'cutoff'
  );

  // Photo Evidence & WhatsApp Automation
  const [enablePhotoCapture, setEnablePhotoCapture] = useState<boolean>(
    settings.enablePhotoCapture !== false
  );
  const [autoCheckOutWithIn, setAutoCheckOutWithIn] = useState<boolean>(
    settings.autoCheckOutWithIn !== false
  );
  const [enableQuickBulkAttendance, setEnableQuickBulkAttendance] = useState<boolean>(
    settings.enableQuickBulkAttendance !== false
  );
  const [whatsappTargetPhone, setWhatsappTargetPhone] = useState<string>(
    settings.whatsappTargetPhone || ''
  );
  const [whatsappTargetName, setWhatsappTargetName] = useState<string>(
    settings.whatsappTargetName || 'Bapak Kepala Sekolah'
  );
  const [returnStartTime, setReturnStartTime] = useState<string>(
    settings.returnStartTime || settings.dailySchedules?.[1]?.returnStartTime || '14:00'
  );

  // Helper untuk mengubah jadwal hari kerja
  const updateMondayThursdaySchedule = (field: 'lateCutoffTime' | 'returnStartTime', val: string) => {
    if (field === 'lateCutoffTime') setLateCutoffTime(val);
    if (field === 'returnStartTime') setReturnStartTime(val);
    setDailySchedules((prev) => {
      const next = { ...prev };
      [1, 2, 3, 4].forEach((d) => {
        next[d] = {
          ...(next[d] || DEFAULT_DAILY_SCHEDULES[d]),
          [field]: val,
        };
      });
      return next;
    });
  };

  const updateDaySchedule = (dayIndex: number, field: keyof WorkDaySchedule, val: any) => {
    setDailySchedules((prev) => ({
      ...prev,
      [dayIndex]: {
        ...(prev[dayIndex] || DEFAULT_DAILY_SCHEDULES[dayIndex]),
        [field]: val,
      },
    }));
  };

  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const kabFileRef = useRef<HTMLInputElement | null>(null);
  const dinasFileRef = useRef<HTMLInputElement | null>(null);
  const sekolahFileRef = useRef<HTMLInputElement | null>(null);
  const signatureFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadKab = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    try {
      const compressed = await compressLogoImage(file);
      setLogoKabupatenUrl(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses logo Kabupaten');
    } finally {
      setIsProcessingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadDinas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    try {
      const compressed = await compressLogoImage(file);
      setLogoDinasUrl(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses logo Dinas');
    } finally {
      setIsProcessingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadSekolah = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    try {
      const compressed = await compressLogoImage(file);
      setLogoSekolahUrl(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses logo Sekolah');
    } finally {
      setIsProcessingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingLogo(true);
    try {
      const compressed = await compressLogoImage(file);
      setHeadmasterSignatureUrl(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses gambar tanda tangan / cap');
    } finally {
      setIsProcessingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Nama dan Email admin wajib diisi.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim() || '1234';

    // Update current admin profile
    onUpdateTeacher({
      ...currentTeacher,
      name: name.trim(),
      nip: nip.trim(),
      email: cleanEmail,
      pin: cleanPin,
      subject: subject.trim() || 'Administrator Sekolah',
    });

    // Update School Settings
    onUpdateSettings({
      ...settings,
      schoolName: schoolName.trim() || 'SD NEGERI INDONESIA',
      schoolAddress: schoolAddress.trim(),
      schoolCity: schoolCity.trim() || 'Jakarta',
      academicYear: academicYear.trim() || '2025/2026',
      lateCutoffTime,
      returnStartTime: returnStartTime || dailySchedules[1]?.returnStartTime || '14:00',
      entryTimeMode,
      dailySchedules,
      enablePhotoCapture,
      autoCheckOutWithIn,
      enableQuickBulkAttendance,
      whatsappTargetPhone: whatsappTargetPhone.trim(),
      whatsappTargetName: whatsappTargetName.trim(),
      headmasterName: headmasterName.trim(),
      headmasterNip: headmasterNip.trim(),
      korwilName: korwilName.trim(),
      korwilNip: korwilNip.trim(),
      korwilTitle: korwilTitle.trim(),
      korwilKecamatan: korwilKecamatan.trim(),
      signatureCity: signatureCity.trim(),
      logoKabupatenUrl,
      logoDinasUrl,
      logoSekolahUrl,
      headmasterSignatureUrl,
      headmasterSignatureType,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl relative my-auto animate-scale-up flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Sticky Fixed Header with Clear, Uncut Close Button */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg font-bold shrink-0">
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                Edit Profil Admin & Identitas Sekolah
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Ubah data profil Anda, PIN login admin, dan pengaturan sekolah.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
            title="Tutup Jendela"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
            <span>Tutup</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Profil Pribadi Admin */}
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved text-amber-700"></i>
              <span>Profil Pribadi Administrator</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Admin & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: MOH. FADLI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NIP Admin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="contoh: 199903202025211020"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Login Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contoh: admin@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PIN Keamanan Login Admin <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="contoh: 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold tracking-wider text-amber-800 focus:outline-none focus:border-indigo-500"
                  />
                  <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jabatan / Bagian
                </label>
                <input
                  type="text"
                  placeholder="contoh: Kurikulum & Administrasi / Kepala Sekolah / IT"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Sekolah & Jadwal */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-school text-indigo-600"></i>
              <span>Identitas Sekolah & Batas Waktu Masuk</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Sekolah / Instansi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="contoh: SD NEGERI 1 INDONESIA"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kota / Kabupaten Sekolah
                </label>
                <input
                  type="text"
                  placeholder="contoh: Jakarta Selatan / Surabaya"
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tahun Ajaran
                </label>
                <input
                  type="text"
                  placeholder="contoh: 2025/2026"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jam Batas Masuk Umum (Toleransi)
                </label>
                <input
                  type="time"
                  value={lateCutoffTime}
                  onChange={(e) => updateMondayThursdaySchedule('lateCutoffTime', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  placeholder="contoh: Jl. Merdeka No. 10"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Pengaturan Jam Kerja Khusus (Senin-Kamis & Jumat) */}
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-business-time text-amber-700"></i>
                <span>Jadwal & Batas Jam Absen Khusus (Hari Kerja)</span>
              </h4>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Senin-Kamis, Jumat & Sabtu
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* Box 1: Senin - Kamis */}
              <div className="bg-white border border-amber-200/90 rounded-xl p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Senin – Kamis
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Reguler
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Batas Masuk (Toleransi)
                    </label>
                    <input
                      type="time"
                      value={dailySchedules[1]?.lateCutoffTime || '07:15'}
                      onChange={(e) => updateMondayThursdaySchedule('lateCutoffTime', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Mulai Jam Pulang
                    </label>
                    <input
                      type="time"
                      value={dailySchedules[1]?.returnStartTime || '14:00'}
                      onChange={(e) => updateMondayThursdaySchedule('returnStartTime', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Lewat jam batas masuk otomatis berstatus <strong>Terlambat</strong>.
                </p>
              </div>

              {/* Box 2: Khusus Hari Jumat */}
              <div className="bg-white border border-emerald-200/90 rounded-xl p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Khusus Hari Jumat
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Jumat Berkah
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Batas Masuk (Toleransi)
                    </label>
                    <input
                      type="time"
                      value={dailySchedules[5]?.lateCutoffTime || '07:00'}
                      onChange={(e) => updateDaySchedule(5, 'lateCutoffTime', e.target.value)}
                      className="w-full bg-slate-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Mulai Jam Pulang
                    </label>
                    <input
                      type="time"
                      value={dailySchedules[5]?.returnStartTime || '11:30'}
                      onChange={(e) => updateDaySchedule(5, 'returnStartTime', e.target.value)}
                      className="w-full bg-slate-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Pulang lebih awal untuk persiapan ibadah Shalat Jumat.
                </p>
              </div>

              {/* Box 3: Hari Sabtu */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dailySchedules[6]?.isActive ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
                    Hari Sabtu
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(dailySchedules[6]?.isActive)}
                      onChange={(e) => updateDaySchedule(6, 'isActive', e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-600">6 Hari Kerja</span>
                  </label>
                </div>
                {dailySchedules[6]?.isActive ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Batas Masuk
                      </label>
                      <input
                        type="time"
                        value={dailySchedules[6]?.lateCutoffTime || '07:15'}
                        onChange={(e) => updateDaySchedule(6, 'lateCutoffTime', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Mulai Jam Pulang
                      </label>
                      <input
                        type="time"
                        value={dailySchedules[6]?.returnStartTime || '12:30'}
                        onChange={(e) => updateDaySchedule(6, 'returnStartTime', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    <i className="fa-solid fa-mug-hot mr-1 text-slate-300"></i> Libur akhir pekan (5 hari kerja)
                  </div>
                )}
                <p className="text-[10px] text-slate-400 leading-tight">
                  Centang opsi 6 Hari Kerja jika sekolah melaksanakan KBM di hari Sabtu.
                </p>
              </div>
            </div>

            {/* Pengaturan Jam Masuk di Rekapan & Dashboard (Sesuai Permintaan User) */}
            <div className="bg-white border border-amber-300 rounded-xl p-3.5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                    <i className="fa-solid fa-clock"></i>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">
                      Format Pengisian Jam Masuk di Rekap & Dashboard
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Pilih bagaimana jam masuk ditampilkan pada tabel rekapan, cetak PDF/Excel, dan riwayat presensi.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {entryTimeMode === 'cutoff'
                    ? 'Batas Jam Terjadwal (07:15 / 07:00)'
                    : entryTimeMode === 'entry'
                    ? 'Jam Jadwal Standar (07:00)'
                    : 'Realtime Jam Scan'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEntryTimeMode('cutoff')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    entryTimeMode === 'cutoff'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-extrabold flex items-center gap-1.5">
                      <i className={`fa-solid ${entryTimeMode === 'cutoff' ? 'fa-circle-check text-indigo-600' : 'fa-circle text-slate-300'} text-[10px]`}></i>
                      Sesuai Batas Jam
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      Aktif
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Jam masuk diisi sesuai batas toleransi: <strong>07:15</strong> (Senin-Kamis) & <strong>07:00</strong> (Jumat).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryTimeMode('entry')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    entryTimeMode === 'entry'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-extrabold flex items-center gap-1.5">
                      <i className={`fa-solid ${entryTimeMode === 'entry' ? 'fa-circle-check text-indigo-600' : 'fa-circle text-slate-300'} text-[10px]`}></i>
                      Jam Masuk Jadwal
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Jam masuk selalu terisi jam mulai jadwal kerja: <strong>07:00</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEntryTimeMode('realtime')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    entryTimeMode === 'realtime'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-extrabold flex items-center gap-1.5">
                      <i className={`fa-solid ${entryTimeMode === 'realtime' ? 'fa-circle-check text-indigo-600' : 'fa-circle text-slate-300'} text-[10px]`}></i>
                      Realtime Detik Scan
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Mengisi waktu aktual saat kamera/QR dipindai (contoh: 10:53:52).
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Foto Bukti Presensi & WhatsApp Otomatis */}
          <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl space-y-4">
            <h4 className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-camera-retro text-sky-700"></i>
              <span>Foto Bukti Presensi & Otomasi Rekap WhatsApp</span>
            </h4>

            <div className="space-y-3">
              {/* Toggle Foto Bukti Presensi */}
              <div className="bg-white border border-sky-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${enablePhotoCapture ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Ambil Foto Snapshot Otomatis saat Scan QR
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Menangkap foto wajah guru langsung saat kartu QR dipindai sebagai bukti otentik fisik. Matikan saklar ini jika ingin presensi lebih cepat tanpa foto kamera.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enablePhotoCapture}
                    onChange={(e) => setEnablePhotoCapture(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Toggle 1x Scan Pagi Langsung Centang Lengkap Sampai Jam Pulang */}
              <div className="bg-white border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${autoCheckOutWithIn ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>Cukup 1x Scan Pagi (Langsung Lengkap Pulang)</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-100 text-indigo-800">
                        Rekomendasi
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Jika aktif: guru hanya perlu scan QR 1 kali saat datang di pagi hari. Jam pulang otomatis terisi dan tercentang lengkap sesuai jadwal kepulangan sekolah hari itu, tanpa perlu antre scan pulang lagi.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoCheckOutWithIn}
                    onChange={(e) => setAutoCheckOutWithIn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Toggle Tombol Absen Cepat (Harian / 1 Bulan Penuh) */}
              <div className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${enableQuickBulkAttendance ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>Tombol Absen Cepat di Tab Rekapitulasi</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        ⚡ Absen Kilat
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Tampilkan tombol <strong>"⚡ Absen Cepat"</strong> di samping tombol <em>Atur Logo</em> pada Rekapitulasi Bulanan untuk mengabsen seluruh guru &amp; tendik sekaligus (bisa per tanggal tertentu atau 1 bulan penuh otomatis).
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enableQuickBulkAttendance}
                    onChange={(e) => setEnableQuickBulkAttendance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Nomor WhatsApp Tujuan Rekap Harian */}
              <div className="bg-white border border-sky-200 rounded-xl p-3 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <i className="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                  <span>Tujuan Kirim Rekap Harian Otomatis</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Nomor WhatsApp (Kepala Sekolah / Grup)
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: 081234567890"
                      value={whatsappTargetPhone}
                      onChange={(e) => setWhatsappTargetPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Keterangan Penerima
                    </label>
                    <input
                      type="text"
                      placeholder="contoh: Bapak Kepala Sekolah / Grup Guru"
                      value={whatsappTargetName}
                      onChange={(e) => setWhatsappTargetName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Tersedia tombol satu-klik di Dashboard untuk langsung membagikan rekapitulasi kehadiran harian lengkap dengan ringkasan status guru.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Data Kepala Sekolah & Korwil untuk Tanda Tangan Laporan */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-file-signature text-indigo-700"></i>
              <span>Data Kepala Sekolah & Korwil (Pengesahan Rekap & Laporan PDF)</span>
            </h4>

            {/* Sub-section: Kepala Sekolah */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                1. Data Kepala Sekolah
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap Kepala Sekolah & Gelar
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: RAHMAT, S.Pd., M.Pd"
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: 19851204 200903 1 002"
                    value={headmasterNip}
                    onChange={(e) => setHeadmasterNip(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Sub-section: Korwil (Koordinator Wilayah Satuan Pendidikan) */}
            <div className="space-y-2 pt-2 border-t border-indigo-200/80">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                2. Data Korwil (Koordinator Wilayah)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap Korwil & Gelar
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: Drs. AGUSTAN, M.A.P"
                    value={korwilName}
                    onChange={(e) => setKorwilName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP Korwil
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: 19670807 199702 1 001"
                    value={korwilNip}
                    onChange={(e) => setKorwilNip(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan Resmi Korwil
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: Koordinator Wilayah Satuan Pendidikan"
                    value={korwilTitle}
                    onChange={(e) => setKorwilTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Wilayah Kecamatan
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: Kecamatan Palasa"
                    value={korwilKecamatan}
                    onChange={(e) => setKorwilKecamatan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lokasi / Kota Penandatanganan (Kop Surat & Tanda Tangan)
                  </label>
                  <input
                    type="text"
                    placeholder="contoh: Palasa Lambori"
                    value={signatureCity}
                    onChange={(e) => setSignatureCity(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Logo Resmi Kop Laporan (Kabupaten & Dinas/Sekolah) */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-image text-emerald-700"></i>
                <span>Logo Resmi Kop Laporan (Kabupaten & Dinas / Sekolah)</span>
              </h4>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                Kop Resmi
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Upload logo kustom wilayah Anda. Logo ini otomatis tampil di Kop Surat layar, hasil cetak printer, dan berkas Unduh PDF resmi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Logo Kab */}
              <div className="border border-emerald-200/80 rounded-xl p-3 bg-white flex flex-col items-center text-center space-y-2">
                <div className="w-full text-left">
                  <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Kiri Kop
                  </span>
                  <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                    Logo Kab. / Pemda
                  </div>
                </div>

                <div className="w-20 h-20 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5">
                  {logoKabupatenUrl ? (
                    <img
                      src={logoKabupatenUrl}
                      alt="Logo Kab"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ParigiMoutongLogo size={52} />
                  )}
                </div>

                <input
                  ref={kabFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleUploadKab}
                  className="hidden"
                />

                <div className="w-full space-y-1">
                  <button
                    type="button"
                    disabled={isProcessingLogo}
                    onClick={() => kabFileRef.current?.click()}
                    className="w-full py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-upload text-[10px]"></i>
                    <span>{logoKabupatenUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                  </button>
                  {logoKabupatenUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoKabupatenUrl(undefined)}
                      className="w-full py-1 text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Reset ke Default
                    </button>
                  )}
                </div>
              </div>

              {/* Logo Dinas */}
              <div className="border border-indigo-200/80 rounded-xl p-3 bg-white flex flex-col items-center text-center space-y-2">
                <div className="w-full text-left">
                  <span className="text-[9px] font-bold uppercase text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                    Kanan Kop
                  </span>
                  <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                    Logo Dinas / Tut Wuri
                  </div>
                </div>

                <div className="w-20 h-20 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5">
                  {logoDinasUrl ? (
                    <img
                      src={logoDinasUrl}
                      alt="Logo Dinas"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <TutWuriHandayaniLogo size={52} variant="official" />
                  )}
                </div>

                <input
                  ref={dinasFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleUploadDinas}
                  className="hidden"
                />

                <div className="w-full space-y-1">
                  <button
                    type="button"
                    disabled={isProcessingLogo}
                    onClick={() => dinasFileRef.current?.click()}
                    className="w-full py-1.5 px-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-upload text-[10px]"></i>
                    <span>{logoDinasUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                  </button>
                  {logoDinasUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoDinasUrl(undefined)}
                      className="w-full py-1 text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Reset ke Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Pengaturan Kartu Guru: Logo Sekolah & Tanda Tangan / QR Kepsek */}
          <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-id-badge text-sky-700"></i>
                <span>Kartu Guru & PTK: Logo Sekolah & Pengesahan Kepala Sekolah</span>
              </h4>
              <span className="text-[10px] bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded-md">
                Kartu Guru
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Konfigurasi logo lambang sekolah di bagian atas kartu dan mode pengesahan resmi Kepala Sekolah (QR Code digital TTE, Tanda Tangan & Cap, atau keduanya).
            </p>

            {/* Mode Pengesahan Selector */}
            <div className="bg-white p-3 rounded-xl border border-sky-200/80 space-y-2">
              <label className="block text-[11px] font-bold text-slate-800">
                Pilihan Pengesahan Kepala Sekolah pada Kartu:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <label
                  onClick={() => setHeadmasterSignatureType('none')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                    headmasterSignatureType === 'none'
                      ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="headmasterSignatureType"
                    checked={headmasterSignatureType === 'none'}
                    onChange={() => setHeadmasterSignatureType('none')}
                    className="text-emerald-600"
                  />
                  <div>
                    <div className="text-[11px] font-bold">Fokus Barcode Penuh</div>
                    <div className="text-[9.5px] text-slate-500 font-normal">Tanpa TTD Kepsek</div>
                  </div>
                </label>

                <label
                  onClick={() => setHeadmasterSignatureType('qr_digital')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                    headmasterSignatureType === 'qr_digital'
                      ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="headmasterSignatureType"
                    checked={headmasterSignatureType === 'qr_digital'}
                    onChange={() => setHeadmasterSignatureType('qr_digital')}
                    className="text-indigo-600"
                  />
                  <div>
                    <div className="text-[11px] font-bold">QR Digital TTE</div>
                    <div className="text-[9.5px] text-slate-500 font-normal">Verifikasi Digital</div>
                  </div>
                </label>

                <label
                  onClick={() => setHeadmasterSignatureType('signature_stamp')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                    headmasterSignatureType === 'signature_stamp'
                      ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="headmasterSignatureType"
                    checked={headmasterSignatureType === 'signature_stamp'}
                    onChange={() => setHeadmasterSignatureType('signature_stamp')}
                    className="text-indigo-600"
                  />
                  <div>
                    <div className="text-[11px] font-bold">TTD & Cap Dinas</div>
                    <div className="text-[9.5px] text-slate-500 font-normal">Cap Basah / Scan</div>
                  </div>
                </label>

                <label
                  onClick={() => setHeadmasterSignatureType('both')}
                  className={`p-2.5 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                    headmasterSignatureType === 'both'
                      ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="headmasterSignatureType"
                    checked={headmasterSignatureType === 'both'}
                    onChange={() => setHeadmasterSignatureType('both')}
                    className="text-indigo-600"
                  />
                  <div>
                    <div className="text-[11px] font-bold">Keduanya (QR + TTD)</div>
                    <div className="text-[9.5px] text-slate-500 font-normal">Lengkap & Autentik</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Upload Logo Sekolah & Upload Scan Tanda Tangan / Cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Logo Sekolah */}
              <div className="border border-sky-200/80 rounded-xl p-3 bg-white flex flex-col items-center text-center space-y-2">
                <div className="w-full text-left">
                  <span className="text-[9px] font-bold uppercase text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                    Header Kartu
                  </span>
                  <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                    Logo Lambang Sekolah
                  </div>
                </div>

                <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1">
                  {logoSekolahUrl ? (
                    <img
                      src={logoSekolahUrl}
                      alt="Logo Sekolah"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center">
                      <i className="fa-solid fa-school text-xl text-sky-500 mb-1"></i>
                      <span className="text-[9px]">Gunakan Tut Wuri</span>
                    </div>
                  )}
                </div>

                <input
                  ref={sekolahFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleUploadSekolah}
                  className="hidden"
                />

                <div className="w-full space-y-1">
                  <button
                    type="button"
                    disabled={isProcessingLogo}
                    onClick={() => sekolahFileRef.current?.click()}
                    className="w-full py-1.5 px-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-upload text-[10px]"></i>
                    <span>{logoSekolahUrl ? 'Ganti Logo Sekolah' : 'Upload Logo Sekolah'}</span>
                  </button>
                  {logoSekolahUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoSekolahUrl(undefined)}
                      className="w-full py-1 text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Hapus / Gunakan Default
                    </button>
                  )}
                </div>
              </div>

              {/* Tanda Tangan & Cap Kepsek */}
              <div className="border border-sky-200/80 rounded-xl p-3 bg-white flex flex-col items-center text-center space-y-2">
                <div className="w-full text-left">
                  <span className="text-[9px] font-bold uppercase text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                    Pengesahan Kartu
                  </span>
                  <div className="text-[11px] font-bold text-slate-800 mt-0.5">
                    Scan TTD & Cap Kepsek
                  </div>
                </div>

                <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1">
                  {headmasterSignatureUrl ? (
                    <img
                      src={headmasterSignatureUrl}
                      alt="TTD & Cap Kepsek"
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs flex flex-col items-center">
                      <i className="fa-solid fa-signature text-xl text-indigo-500 mb-1"></i>
                      <span className="text-[9px]">Belum Ada File</span>
                    </div>
                  )}
                </div>

                <input
                  ref={signatureFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleUploadSignature}
                  className="hidden"
                />

                <div className="w-full space-y-1">
                  <button
                    type="button"
                    disabled={isProcessingLogo}
                    onClick={() => signatureFileRef.current?.click()}
                    className="w-full py-1.5 px-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-upload text-[10px]"></i>
                    <span>{headmasterSignatureUrl ? 'Ganti TTD & Cap' : 'Upload TTD & Cap'}</span>
                  </button>
                  {headmasterSignatureUrl && (
                    <button
                      type="button"
                      onClick={() => setHeadmasterSignatureUrl(undefined)}
                      className="w-full py-1 text-[10px] text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                    >
                      Hapus File TTD
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check"></i>
              <span>Simpan Profil Admin & Data Sekolah</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
