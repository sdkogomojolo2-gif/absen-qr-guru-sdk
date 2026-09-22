import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'sidebar';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed standalone PWA, suppress
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      // Open guided instruction modal for manual browser install
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          id="btn-pwa-install-header"
          type="button"
          onClick={handleInstallClick}
          className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
            isInstallable
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/40 shadow-emerald-950/20'
              : 'bg-indigo-600/80 hover:bg-indigo-600 text-white border-indigo-400/30'
          } ${className}`}
          title="Instal aplikasi ke HP atau Laptop agar bisa dibuka langsung seperti aplikasi asli"
        >
          <i className="fa-solid fa-download text-xs group-hover:scale-110 transition-transform"></i>
          <span className="whitespace-nowrap">Instal Aplikasi</span>
          {isInstallable && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
            </span>
          )}
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          id="btn-pwa-install-sidebar"
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            isInstallable
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700/60'
          } ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-mobile-screen-button"></i>
            </div>
            <div className="text-left">
              <div className="text-[12px] font-bold text-white">Instal di HP & Laptop</div>
              <div className="text-[10px] text-slate-400 font-normal">Akses cepat tanpa browser</div>
            </div>
          </div>
          <i className="fa-solid fa-arrow-down-to-bracket text-xs text-emerald-400"></i>
        </button>
      )}

      {variant === 'banner' && (
        <div
          id="pwa-install-banner"
          className="bento-card bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-indigo-500/30 p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg shrink-0">
              <i className="fa-solid fa-mobile-screen"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Instal Absensi Guru di HP atau Laptop</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Bisa dibuka langsung dari layar utama HP / desktop tanpa mengetik URL, bekerja lebih cepat dan hemat kuota.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-download text-xs"></i>
              <span>{isInstallable ? 'Instal Sekarang' : 'Panduan Pasang'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all border border-slate-700 cursor-pointer"
              title="Lihat petunjuk instalasi"
            >
              <i className="fa-solid fa-circle-question"></i>
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal for iOS Safari, Android, and Desktop PC */}
      {showGuideModal && (
        <div
          id="pwa-guide-modal"
          className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-left my-8">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="App Icon"
                  className="w-12 h-12 rounded-2xl shadow-md border border-indigo-500/30"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Instal Aplikasi Absensi Guru
                  </h3>
                  <p className="text-xs text-slate-400">
                    SDK Ogomojolo • PWA (Progressive Web App)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {isInstallable && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="text-xs text-emerald-300 font-medium">
                  Browser Anda mendukung instalasi langsung 1-klik!
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setShowGuideModal(false);
                    await install();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-download text-xs"></i>
                  <span>Pasang Sekarang</span>
                </button>
              </div>
            )}

            <div className="space-y-4 text-xs text-slate-300">
              {/* Android instructions */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <div className="w-5 h-5 rounded-md bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs">
                    <i className="fa-brands fa-android"></i>
                  </div>
                  <span>1. Pada HP Android (Google Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
                  <li>Buka link aplikasi ini di browser <strong>Google Chrome</strong>.</li>
                  <li>Ketuk ikon <strong>titik tiga (⋮)</strong> di pojok kanan atas browser.</li>
                  <li>Pilih <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                  <li>Ikon aplikasi akan muncul di layar utama HP Anda dan bisa dibuka langsung layaknya aplikasi Play Store.</li>
                </ol>
              </div>

              {/* iOS iPhone instructions */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <div className="w-5 h-5 rounded-md bg-sky-600/20 text-sky-400 flex items-center justify-center text-xs">
                    <i className="fa-brands fa-apple"></i>
                  </div>
                  <span>2. Pada iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
                  <li>Buka link aplikasi ini di browser <strong>Safari</strong>.</li>
                  <li>Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <i className="fa-solid fa-arrow-up-from-bracket text-[10px]"></i>).</li>
                  <li>Gulir ke bawah, lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                  <li>Ketuk <strong>"Tambah"</strong> di pojok kanan atas.</li>
                </ol>
              </div>

              {/* Laptop / PC instructions */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <div className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs">
                    <i className="fa-solid fa-laptop"></i>
                  </div>
                  <span>3. Pada Laptop / Komputer (Chrome atau Microsoft Edge):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1 leading-relaxed">
                  <li>Lihat di sebelah kanan <strong>bilah alamat URL (Address Bar)</strong>.</li>
                  <li>Klik ikon <strong>Instal (Komputer dengan panah bawah / App Available)</strong>.</li>
                  <li>Atau klik menu titik tiga browser &gt; pilih <strong>"Instal Presensi SDN Kecil Ogomojolo"</strong>.</li>
                  <li>Aplikasi akan berjalan di jendela mandiri tanpa tampilan browser.</li>
                </ol>
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Mengerti &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
