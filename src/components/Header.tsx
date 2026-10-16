import React, { useState, useEffect } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  isCustomFirebaseEnabled,
  getStoredCustomFirebaseConfig,
  onCustomConfigChange,
  CustomFirebaseConfig,
} from '../services/customFirebaseService';

interface HeaderProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onToggleMobileSidebar?: () => void;
  currentSchoolName?: string;
  onShareLink?: () => void;
  onOpenRetroactiveAttendance?: () => void;
  onOpenCustomFirebase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode = false,
  onToggleDarkMode,
  onToggleMobileSidebar,
  currentSchoolName = 'SDK OGOMOJOLO',
  onShareLink,
  onOpenRetroactiveAttendance,
  onOpenCustomFirebase,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isCustomCloud, setIsCustomCloud] = useState<boolean>(() => isCustomFirebaseEnabled());
  const [customConfig, setCustomConfig] = useState<CustomFirebaseConfig | null>(() => getStoredCustomFirebaseConfig());

  useEffect(() => {
    const unsub = onCustomConfigChange((enabled, cfg) => {
      setIsCustomCloud(enabled);
      setCustomConfig(cfg);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 transition-colors print:hidden shadow-xs">
      {/* Red - White SD Ribbon Bar */}
      <div className="rgy-tricolor-bar"></div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Sidebar Toggle + Live Date & Time + PTK Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle (hidden on desktop) */}
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-200 border border-red-200 dark:border-red-800 transition-colors cursor-pointer shrink-0"
              title="Buka Navigasi Menu"
              aria-label="Toggle navigation"
            >
              <i className="fa-solid fa-bars text-sm"></i>
            </button>
          )}

          {/* Date & Time Display */}
          <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium shadow-2xs shrink-0">
            <i className="fa-regular fa-calendar-days text-red-600 text-xs"></i>
            <span className="font-semibold text-slate-900 dark:text-white hidden sm:inline">{formattedDate}</span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="font-mono font-bold text-red-700 dark:text-red-400">
              {formattedTime} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">WITA/WIB</span>
            </span>
          </div>

          {/* Red & White Indicator Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="Presensi Guru"></span>
            <span className="text-red-800 dark:text-red-200 font-semibold tracking-wide ml-0.5">Presensi Guru & PTK</span>
          </div>
        </div>

        {/* Right: PWA Install + Active School Pill + Lupa Absensi + Dark/Light Toggle */}
        <div className="flex items-center gap-2">
          {/* In-App PWA Install Button for mobile & desktop */}
          <PWAInstallButton variant="header" />

          {/* Cloud Database Status Pill (Hijau = Terhubung ke Cloud Pribadi, Abu-abu = Mode Offline/Lokal) */}
          <button
            type="button"
            onClick={onOpenCustomFirebase}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
              isCustomCloud && customConfig
                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title={
              isCustomCloud && customConfig
                ? `Terhubung ke Cloud Pribadi (Project: ${customConfig.projectId}). Klik untuk membuka pengaturan.`
                : 'Mode Offline / Lokal (Bawaan). Klik untuk menghubungkan Firebase milik sendiri.'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isCustomCloud && customConfig
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-400 dark:bg-slate-500'
              }`}
            ></span>
            <span className="hidden sm:inline">
              {isCustomCloud && customConfig ? 'Cloud Pribadi' : 'Mode Offline/Lokal'}
            </span>
            <span className="sm:hidden text-[11px]">
              {isCustomCloud && customConfig ? 'Cloud' : 'Lokal'}
            </span>
            <i className={`fa-solid fa-cloud text-[11px] ${isCustomCloud && customConfig ? 'text-emerald-600' : 'text-slate-400'}`}></i>
          </button>

          {onOpenRetroactiveAttendance && (
            <button
              type="button"
              onClick={onOpenRetroactiveAttendance}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
              title="Koreksi atau input absensi masa lampau / lupa absensi"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs text-red-600 dark:text-red-400"></i>
              <span className="hidden sm:inline">Lupa Absensi</span>
            </button>
          )}

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 shadow-2xs max-w-[190px] sm:max-w-[320px]"
            title={`Instansi: ${currentSchoolName}`}
          >
            <i className="fa-solid fa-graduation-cap text-red-600 text-xs shrink-0"></i>
            <span className="font-bold text-slate-900 dark:text-white truncate text-[11px] sm:text-xs">
              {currentSchoolName}
            </span>
          </div>

          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-sm font-bold text-slate-700 dark:text-amber-300 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-2xs shrink-0"
              title={isDarkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Toggle Dark Mode"
            >
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400 text-base' : 'fa-moon text-slate-600 text-base'}`}></i>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
