import React, { useState, useEffect } from 'react';
import {
  CustomFirebaseConfig,
  getStoredCustomFirebaseConfig,
  isCustomFirebaseEnabled,
  saveCustomFirebaseConfig,
  resetCustomFirebaseConfig,
  setCustomFirebaseEnabled,
  parseFirebaseConfigInput,
  testFirebaseConnection,
  ConnectionTestResult,
  onCustomConfigChange,
} from '../services/customFirebaseService';
import { syncAllLocalDataToCustomCloud } from '../services/firestoreService';
import { Student, AttendanceRecord, SystemSettings, Teacher, School } from '../types';

interface CustomFirebaseSettingsProps {
  onShowToast?: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  // Optional local data for one-click initial migration
  localData?: {
    schools?: School[];
    students: Student[];
    teachers: Teacher[];
    settings: SystemSettings;
    attendanceRecords: AttendanceRecord[];
  };
}

export const CustomFirebaseSettings: React.FC<CustomFirebaseSettingsProps> = ({
  onShowToast,
  localData,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => isCustomFirebaseEnabled());
  const [storedConfig, setStoredConfig] = useState<CustomFirebaseConfig | null>(() => getStoredCustomFirebaseConfig());
  const [rawInput, setRawInput] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<CustomFirebaseConfig | null>(null);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const [isSyncingInitial, setIsSyncingInitial] = useState<boolean>(false);
  const [syncInitialMessage, setSyncInitialMessage] = useState<string | null>(null);

  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [copiedRules, setCopiedRules] = useState<boolean>(false);

  // Sync state if config changes anywhere in the app
  useEffect(() => {
    const unsub = onCustomConfigChange((enabled, cfg) => {
      setIsEnabled(enabled);
      setStoredConfig(cfg);
    });
    return unsub;
  }, []);

  // Pre-fill rawInput if there is already a stored config and user hasn't typed anything
  useEffect(() => {
    if (storedConfig && !rawInput) {
      setRawInput(JSON.stringify(storedConfig, null, 2));
      setParsedPreview(storedConfig);
    }
  }, [storedConfig]);

  // Handle parsing when rawInput changes
  const handleInputChange = (val: string) => {
    setRawInput(val);
    setTestResult(null);
    if (!val.trim()) {
      setParsedPreview(null);
      return;
    }
    const result = parseFirebaseConfigInput(val);
    setParsedPreview(result);
  };

  // Toggle enable/disable
  const handleToggle = (checked: boolean) => {
    if (checked && !storedConfig && !parsedPreview) {
      if (onShowToast) {
        onShowToast('Konfigurasi Kosong', 'Tempel konfigurasi Firebase terlebih dahulu dan lakukan Tes Koneksi.', 'warning');
      }
      return;
    }
    setIsEnabled(checked);
    setCustomFirebaseEnabled(checked);
    if (onShowToast) {
      onShowToast(
        checked ? 'Cloud Pribadi Aktif' : 'Kembali ke Bawaan',
        checked ? 'Aplikasi sekarang menggunakan Firebase milik Anda.' : 'Aplikasi menggunakan penyimpanan default/offline.',
        'info'
      );
    }
  };

  // Test and save
  const handleTestAndSave = async () => {
    const targetConfig = parsedPreview || parseFirebaseConfigInput(rawInput);
    if (!targetConfig) {
      const msg = 'Format konfigurasi Firebase tidak valid. Pastikan memuat apiKey, projectId, dan appId.';
      setTestResult({ success: false, message: msg });
      if (onShowToast) onShowToast('Format Tidak Valid', msg, 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testFirebaseConnection(targetConfig);
      setTestResult(result);

      if (result.success) {
        saveCustomFirebaseConfig(targetConfig, true);
        setIsEnabled(true);
        setStoredConfig(targetConfig);
        if (onShowToast) {
          onShowToast(
            'Koneksi ke Firebase Berhasil!',
            `Terhubung ke Project ID: ${targetConfig.projectId} (${result.latencyMs}ms)`,
            'success'
          );
        }
      } else {
        if (onShowToast) {
          onShowToast('Koneksi Gagal', result.message, 'error');
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Terjadi kesalahan saat menguji koneksi.';
      setTestResult({ success: false, message: msg });
      if (onShowToast) onShowToast('Koneksi Gagal', msg, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin memutuskan koneksi Firebase mandiri dan kembali ke pengaturan awal?')) {
      resetCustomFirebaseConfig();
      setIsEnabled(false);
      setStoredConfig(null);
      setRawInput('');
      setParsedPreview(null);
      setTestResult(null);
      setSyncInitialMessage(null);
      if (onShowToast) {
        onShowToast('Koneksi Diputuskan', 'Kembali ke konfigurasi default / offline.', 'info');
      }
    }
  };

  // Optional: Upload current local data to the newly connected database
  const handleSyncInitialData = async () => {
    if (!localData) return;
    setIsSyncingInitial(true);
    setSyncInitialMessage(null);

    try {
      const res = await syncAllLocalDataToCustomCloud(localData);
      setSyncInitialMessage(`Berhasil menyalin ${res.count} data (Profil Sekolah, PTK/Guru, Jadwal, dan Riwayat) ke Cloud Firestore pribadi Anda!`);
      if (onShowToast) {
        onShowToast('Sinkronisasi Awal Berhasil', `${res.count} data berhasil disalin ke Cloud pribadi.`, 'success');
      }
    } catch (err: any) {
      const errText = err?.message || 'Gagal menyalin data awal ke Cloud.';
      setSyncInitialMessage(`Error: ${errText}`);
      if (onShowToast) {
        onShowToast('Gagal Salin Data', errText, 'error');
      }
    } finally {
      setIsSyncingInitial(false);
    }
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
    if (onShowToast) onShowToast('Tersalin', 'Aturan Firestore Rules berhasil disalin.', 'info');
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-white dark:from-amber-950/20 dark:via-orange-950/10 dark:to-slate-900 border-2 border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80 dark:border-amber-800/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
            <i className="fa-solid fa-fire"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider">
                Database Cloud Pribadi (Firebase)
              </h4>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                BYO Database
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              Gunakan akun Firebase Anda sendiri agar database sekolah 100% terpisah, aman, dan data tersimpan di Cloud milik instansi Anda sendiri.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2.5 self-start sm:self-center bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
            Gunakan Firebase Sendiri
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => handleToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* Active Status Banner */}
      {isEnabled && storedConfig && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <div className="text-xs truncate">
              <span className="font-bold">Status: Terhubung ke Cloud Pribadi</span>
              <span className="mx-1.5">•</span>
              <span className="font-mono font-medium text-[11px]">Project: {storedConfig.projectId}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer shrink-0"
          >
            Putuskan
          </button>
        </div>
      )}

      {/* Textarea Input Form */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Konfigurasi Firebase (JSON atau Kode JavaScript Console)
          </label>
          {parsedPreview ? (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <i className="fa-solid fa-circle-check"></i>
              Format Terdeteksi ({parsedPreview.projectId})
            </span>
          ) : rawInput.trim() ? (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <i className="fa-solid fa-triangle-exclamation"></i>
              Memproses format input...
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Tempel kode dari Firebase Console
            </span>
          )}
        </div>

        <textarea
          rows={5}
          value={rawInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={`Contoh JSON:\n{\n  "apiKey": "AIzaSy...",\n  "projectId": "sekolah-absen-123",\n  "appId": "1:123456:web:abcdef"\n}\n\nAtau langsung potongan kode dari Firebase Console:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "sekolah-absen-123.firebaseapp.com",\n  projectId: "sekolah-absen-123",\n  appId: "1:123456:web:abcdef"\n};`}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        {/* Live Parsed Preview Chips */}
        {parsedPreview && (
          <div className="p-3 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Parameter Yang Diekstrak Otomatis:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9.5px]">Project ID:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {parsedPreview.projectId}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9.5px]">API Key:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {parsedPreview.apiKey ? `${parsedPreview.apiKey.substring(0, 10)}...` : '-'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9.5px]">App ID:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {parsedPreview.appId}
                </span>
              </div>
              {parsedPreview.authDomain && (
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[9.5px]">Auth Domain:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">
                    {parsedPreview.authDomain}
                  </span>
                </div>
              )}
              {parsedPreview.storageBucket && (
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[9.5px]">Storage Bucket:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">
                    {parsedPreview.storageBucket}
                  </span>
                </div>
              )}
              {parsedPreview.messagingSenderId && (
                <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[9.5px]">Sender ID:</span>
                  <span className="text-slate-800 dark:text-slate-200 truncate block">
                    {parsedPreview.messagingSenderId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test Result Message Box */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            <i
              className={`fa-solid ${
                testResult.success
                  ? 'fa-circle-check text-emerald-600 text-base'
                  : 'fa-circle-xmark text-rose-600 text-base'
              }`}
            ></i>
          </div>
          <div className="flex-1">
            <div className="font-extrabold mb-0.5">
              {testResult.success ? 'Koneksi ke Firebase Berhasil!' : 'Koneksi ke Firebase Gagal'}
            </div>
            <p className="text-[11.5px]">{testResult.message}</p>
            {testResult.latencyMs !== undefined && (
              <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-bold">
                Latency: {testResult.latencyMs} ms
              </span>
            )}
            {testResult.details && !testResult.success && (
              <details className="mt-1.5 text-[10.5px] text-rose-800 dark:text-rose-300 font-mono">
                <summary className="cursor-pointer hover:underline">Lihat Rincian Error Teknis</summary>
                <div className="p-2 mt-1 rounded bg-rose-100/70 dark:bg-rose-900/40 break-all">
                  {testResult.details}
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={isTesting || (!rawInput.trim() && !storedConfig)}
          onClick={handleTestAndSave}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 min-w-[200px]"
        >
          {isTesting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin text-sm"></i>
              <span>Sedang Menguji Koneksi...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-plug-circle-check text-sm"></i>
              <span>Tes Koneksi & Simpan</span>
            </>
          )}
        </button>

        {storedConfig && (
          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            title="Putuskan koneksi custom Firebase dan kembali ke pengaturan bawaan"
          >
            <i className="fa-solid fa-arrow-rotate-left text-xs"></i>
            <span>Reset ke Default</span>
          </button>
        )}
      </div>

      {/* Optional: Seed Initial Data to Customer Cloud */}
      {isEnabled && storedConfig && localData && (
        <div className="bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-cloud-arrow-up text-amber-700 dark:text-amber-400 text-xs"></i>
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                Salin Data Awal ke Cloud Pribadi
              </span>
            </div>
            <span className="text-[10px] bg-amber-200/90 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-bold">
              Database Baru Kosong
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Jika database Firebase Anda baru dibuat dan masih kosong, klik tombol ini untuk menyalin data Profil Sekolah, Daftar Guru ({localData.teachers.length} PTK), dan Pengaturan saat ini ke Cloud Anda.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isSyncingInitial}
              onClick={handleSyncInitialData}
              className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSyncingInitial ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Sedang Menyalin Data...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-upload text-xs"></i>
                  <span>Salin Semua Data ke Cloud Pribadi Sekarang</span>
                </>
              )}
            </button>
          </div>
          {syncInitialMessage && (
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 pt-1">
              {syncInitialMessage}
            </div>
          )}
        </div>
      )}

      {/* Accordion: Panduan Singkat Buat Firebase Gratis */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white/70 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => setShowGuide((prev) => !prev)}
          className="w-full px-4 py-2.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-book-open text-amber-600"></i>
            <span>Panduan Singkat: Cara Membuat Firebase Gratis di Console Google</span>
          </div>
          <i className={`fa-solid fa-chevron-${showGuide ? 'up' : 'down'} text-slate-400 text-xs`}></i>
        </button>

        {showGuide && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            <ol className="list-decimal list-inside space-y-2 leading-relaxed text-[11.5px]">
              <li>
                <strong>Buka Firebase Console:</strong> Kunjungi{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-bold"
                >
                  console.firebase.google.com
                </a>{' '}
                dan login dengan akun Google Anda (100% Gratis di paket Spark).
              </li>
              <li>
                <strong>Buat Project Baru:</strong> Klik <em>"Add Project"</em> (atau <em>"Create a project"</em>), beri nama project (misal: <code>presensi-sdn-ogomojolo</code>), lalu ikuti panduan sampai selesai.
              </li>
              <li>
                <strong>Tambah Web App:</strong> Di dashboard project, klik icon Web <code>&lt;/&gt;</code> untuk menambahkan aplikasi Web. Masukkan nama aplikasi, lalu klik <em>"Register app"</em>.
              </li>
              <li>
                <strong>Salin <code>firebaseConfig</code>:</strong> Salin blok kode <code>const firebaseConfig = &#123; ... &#125;;</code> yang muncul, lalu tempelkan langsung ke kotak teks di atas.
              </li>
              <li>
                <strong>Buat Database Firestore:</strong> Di menu kiri Firebase Console, klik <strong>Build &gt; Firestore Database</strong> &gt; Klik <strong>"Create database"</strong>. Pilih lokasi server terdekat (contoh: <code>asia-southeast1</code> atau <code>asia-southeast2</code>) dan pilih <em>Start in test mode</em>.
              </li>
              <li>
                <strong>Pastikan Tab Rules Aktif:</strong> Buka tab <strong>Rules</strong> pada Firestore, pastikan aturan mengizinkan baca dan tulis:
              </li>
            </ol>

            {/* Rules Snippet with Copy Button */}
            <div className="relative mt-2">
              <pre className="p-3 bg-slate-900 text-amber-300 font-mono text-[10.5px] rounded-xl overflow-x-auto">
                {sampleRules}
              </pre>
              <button
                type="button"
                onClick={handleCopyRules}
                className="absolute top-2 right-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <i className={`fa-solid ${copiedRules ? 'fa-check' : 'fa-copy'}`}></i>
                <span>{copiedRules ? 'Tersalin!' : 'Salin Rules'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Setelah langkah di atas selesai, klik tombol <strong>"Tes Koneksi & Simpan"</strong> di atas. Data absensi dan guru Anda akan langsung tersimpan di Cloud pribadi Anda secara mandiri!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
