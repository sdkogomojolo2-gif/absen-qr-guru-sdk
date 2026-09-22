import React, { useState, useRef } from 'react';
import { SystemSettings } from '../types';
import { ParigiMoutongLogo } from './ParigiMoutongLogo';
import { TutWuriHandayaniLogo } from './TutWuriHandayaniLogo';
import { compressLogoImage } from '../utils/imageCompressor';

interface LogoSettingsModalProps {
  settings: SystemSettings;
  onUpdateSettings: (updated: SystemSettings) => void;
  onClose: () => void;
}

export const LogoSettingsModal: React.FC<LogoSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [logoKabupaten, setLogoKabupaten] = useState<string | undefined>(settings.logoKabupatenUrl);
  const [logoDinas, setLogoDinas] = useState<string | undefined>(settings.logoDinasUrl);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const kabInputRef = useRef<HTMLInputElement | null>(null);
  const dinasInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadKabupaten = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    setIsProcessing(true);
    try {
      const compressed = await compressLogoImage(file);
      setLogoKabupaten(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses gambar logo Kabupaten.');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadDinas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    setIsProcessing(true);
    try {
      const compressed = await compressLogoImage(file);
      setLogoDinas(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses gambar logo Dinas.');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      logoKabupatenUrl: logoKabupaten,
      logoDinasUrl: logoDinas,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl relative my-auto animate-scale-up flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold shrink-0">
              <i className="fa-solid fa-image"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                Pengaturan Logo Kop Resmi
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Upload logo resmi Kabupaten dan Dinas / Sekolah untuk Kop Surat & Rekapitulasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-sm shrink-0"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <i className="fa-solid fa-circle-info text-emerald-700 text-sm mt-0.5 shrink-0"></i>
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-bold text-emerald-950">
                Informasi Penerapan Logo:
              </p>
              <p>
                Logo yang Anda upload di sini akan langsung menggantikan logo di <strong>Kop Surat Rekapitulasi Presensi</strong>, pada <strong>Cetak Printer / Browser</strong>, dan berkas <strong>Unduh PDF Resmi</strong>.
              </p>
              <p className="text-slate-600">
                Disarankan menggunakan gambar PNG berlatar transparan dengan orientasi simetris.
              </p>
            </div>
          </div>

          {/* Two Columns: Logo Kab vs Logo Dinas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Box 1: Logo Kabupaten */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 flex flex-col items-center text-center space-y-3">
              <div className="w-full text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Kiri Kop
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                  Logo Pemerintah Kabupaten
                </h4>
                <p className="text-[11px] text-slate-500">
                  Lambang Pemda Kab. Parigi Moutong
                </p>
              </div>

              {/* Preview Box */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shadow-xs">
                {logoKabupaten ? (
                  <img
                    src={logoKabupaten}
                    alt="Logo Kabupaten"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <ParigiMoutongLogo size={70} />
                    <span className="text-[9px] text-slate-400 mt-1">Default Sistem</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-full space-y-2 pt-1">
                <input
                  ref={kabInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleUploadKabupaten}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => kabInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-upload text-emerald-200"></i>
                  <span>{logoKabupaten ? 'Ganti Logo Kab.' : 'Upload Logo Kab.'}</span>
                </button>

                {logoKabupaten && (
                  <button
                    type="button"
                    onClick={() => setLogoKabupaten(undefined)}
                    className="w-full py-1.5 px-3 rounded-xl text-slate-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-rotate-left text-xs"></i>
                    <span>Kembali ke Logo Default</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Logo Dinas / Tut Wuri Handayani / Sekolah */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 flex flex-col items-center text-center space-y-3">
              <div className="w-full text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                  Kanan Kop
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                  Logo Dinas / Tut Wuri / Sekolah
                </h4>
                <p className="text-[11px] text-slate-500">
                  Lambang Dinas Pendidikan / Tut Wuri Handayani
                </p>
              </div>

              {/* Preview Box */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shadow-xs">
                {logoDinas ? (
                  <img
                    src={logoDinas}
                    alt="Logo Dinas"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <TutWuriHandayaniLogo size={70} variant="official" />
                    <span className="text-[9px] text-slate-400 mt-1">Default Sistem</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-full space-y-2 pt-1">
                <input
                  ref={dinasInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleUploadDinas}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => dinasInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-upload text-indigo-200"></i>
                  <span>{logoDinas ? 'Ganti Logo Dinas' : 'Upload Logo Dinas'}</span>
                </button>

                {logoDinas && (
                  <button
                    type="button"
                    onClick={() => setLogoDinas(undefined)}
                    className="w-full py-1.5 px-3 rounded-xl text-slate-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <i className="fa-solid fa-arrow-rotate-left text-xs"></i>
                    <span>Kembali ke Logo Default</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Simpan Perubahan Logo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
