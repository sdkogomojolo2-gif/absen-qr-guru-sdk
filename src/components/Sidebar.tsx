import React from 'react';
import { ActiveTab, SystemSettings, Teacher } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayCount: number;
  settings: SystemSettings;
  currentTeacher: Teacher | null;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onOpenTeacherManage: () => void;
  onOpenCloudSync: () => void;
  onOpenAdminProfile?: () => void;
  onOpenGuide?: () => void;
  onOpenAnnouncement?: () => void;
  onOpenERaporSync?: () => void;
  onShareLink?: () => void;
  onOpenRetroactiveAttendance?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todayCount,
  settings,
  currentTeacher,
  onOpenLogin,
  onLogout,
  onOpenTeacherManage,
  onOpenCloudSync,
  onOpenAdminProfile,
  onOpenGuide,
  onOpenAnnouncement,
  onShareLink,
  onOpenRetroactiveAttendance,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Absensi',
      icon: 'fa-solid fa-chart-pie',
      badge: null,
    },
    {
      id: 'scanner' as ActiveTab,
      label: 'Scan Absen QR',
      icon: 'fa-solid fa-camera',
      badge: 'LIVE PTK',
      badgeClass: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'students' as ActiveTab,
      label: 'Input Data Guru & ID Card',
      icon: 'fa-solid fa-id-card-clip',
      badge: null,
    },
    {
      id: 'retroactive_action' as const,
      label: 'Lupa Absensi',
      icon: 'fa-solid fa-clock-rotate-left',
      badge: 'Lupa Absen',
      badgeClass: 'bg-amber-400/30 text-amber-200 border border-amber-400/40',
      isAction: true,
    },
    {
      id: 'rekap_dinas' as ActiveTab,
      label: 'Rekap Absensi',
      icon: 'fa-solid fa-table-cells',
      badge: 'FORMAT DINAS',
      badgeClass: 'bg-amber-400 text-slate-950 font-black',
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 text-red-100">
      {/* Top: School Brand Identity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-red-800/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white via-red-200 to-red-400 p-[2px] shadow-md shadow-red-950/40 shrink-0">
              <div className="w-full h-full bg-[#800d17] rounded-[10px] flex items-center justify-center text-white font-bold text-lg">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm leading-tight text-white truncate">
                {settings.schoolName || 'SDK OGOMOJOLO'}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-white/20 text-white border border-white/30">
                  TA {settings.academicYear || '2025/2026'}
                </span>
                <span className="text-[10px] text-red-200/90 truncate font-medium">
                  Presensi Guru & PTK
                </span>
              </div>
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-red-800/60 transition-colors"
              title="Tutup Menu"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          )}
        </div>

        {/* Section: Menu Navigasi Utama */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/70 mb-2 px-3 flex items-center justify-between">
            <span>Menu Presensi Guru</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-300"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            </span>
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isAction = 'isAction' in item && item.isAction;
              const isActive = !isAction && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isAction) {
                      if (onOpenRetroactiveAttendance) onOpenRetroactiveAttendance();
                      if (onCloseMobile) onCloseMobile();
                    } else {
                      handleSelectTab(item.id as ActiveTab);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-red-900 shadow-md shadow-red-950/30 border border-white/60'
                      : isAction
                      ? 'text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/40'
                      : 'text-red-100 hover:bg-red-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i
                      className={`${item.icon} text-sm w-4 text-center ${
                        isActive ? 'text-red-700' : isAction ? 'text-amber-300' : 'text-red-200/80'
                      }`}
                    ></i>
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.id === 'dashboard' && todayCount > 0 && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : 'bg-red-950/80 text-red-100 border border-red-800/60'
                        }`}
                      >
                        {todayCount} Hadir
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section: Database & Sinkronisasi */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/70 mb-2 px-3 flex items-center justify-between">
            <span>Database & Sinkronisasi</span>
            <span className="text-[9px] text-white/90 font-mono font-bold">Cloud & .db</span>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                onOpenCloudSync();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-950 bg-white hover:bg-red-50 border border-white/80 shadow-md shadow-red-950/30 transition-all cursor-pointer group"
              title="Simpan database absen harian ke Cloud Firestore & file database.db lokal"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 border border-red-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-cloud-arrow-up text-xs text-red-700"></i>
                </div>
                <div className="text-left min-w-0">
                  <div className="truncate font-extrabold text-[11px] leading-tight text-red-950">Simpan Database Absen Harian</div>
                  <div className="text-[9px] text-red-700/80 font-normal">Cloud & SQLite database.db</div>
                </div>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-700 text-white shrink-0 uppercase tracking-tight ml-1">
                Wajib Sinkron
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Profil Guru / Pengguna */}
      <div className="pt-4 border-t border-red-800/60 mt-6">
        {/* PWA Install Button for mobile & desktop */}
        <div className="mb-3">
          <PWAInstallButton variant="sidebar" />
        </div>

        <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-200/70 mb-2 px-1">
          Pengguna Aktif
        </div>

        {currentTeacher ? (
          <div className="bg-[#780d15] border border-red-700/70 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                  currentTeacher.role === 'admin'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'bg-red-800 text-white shadow-xs'
                }`}
              >
                <i
                  className={
                    currentTeacher.role === 'admin'
                      ? 'fa-solid fa-shield-halved text-xs'
                      : 'fa-solid fa-user-tie text-xs'
                  }
                ></i>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs text-white truncate" title={currentTeacher.name}>
                  {currentTeacher.name}
                </div>
                <div className="text-[10px] text-red-200/80 truncate">
                  {currentTeacher.email || 'Guru / PTK'}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span
                    className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      currentTeacher.role === 'admin'
                        ? 'bg-white text-red-900 border border-white/80'
                        : 'bg-red-900/90 text-red-100 border border-red-700/80'
                    }`}
                  >
                    {currentTeacher.role === 'admin' ? 'Admin / Operator' : 'Guru / Pendidik'}
                  </span>
                  {currentTeacher.nip && (
                    <span className="text-[9px] text-red-200/80 font-mono">
                      NIP: {currentTeacher.nip}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 pt-2.5 border-t border-red-800/60 space-y-1">
              {currentTeacher.role === 'admin' && onOpenAdminProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAdminProfile();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-800/60 text-[11px] font-medium text-red-100 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-school text-red-300 text-xs w-4"></i>
                  <span>Edit Profil Sekolah</span>
                </button>
              )}

              {currentTeacher.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTeacherManage();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-800/60 text-[11px] font-medium text-red-100 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-users-gear text-red-300 text-xs w-4"></i>
                  <span>Kelola Akun Guru</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    onOpenLogin();
                  }
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-950/80 text-[11px] font-semibold text-rose-200 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-right-from-bracket text-xs w-4"></i>
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#780d15] border border-red-700/70 rounded-2xl p-3 text-center">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-red-900 flex items-center justify-center text-white text-xs">
              <i className="fa-solid fa-user-lock"></i>
            </div>
            <p className="text-xs font-bold text-white">Login Akun Guru / PTK</p>
            <p className="text-[10px] text-red-200/80 mt-0.5 mb-2.5">
              Masuk untuk akses fitur admin & tanda tangan
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenLogin();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-right-to-bracket text-xs"></i>
              <span>Login Akun Guru</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Locked Sidebar - Red Merah SD */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 shrink-0 bg-[#8b101b] border-r border-red-900/60 z-30 select-none overflow-y-auto print:hidden shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex print:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          ></div>
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-[#8b101b] border-r border-red-900/60 z-50 overflow-y-auto shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#8b101b]/95 backdrop-blur-md border-t border-red-900/60 z-40 px-1 py-1.5 shadow-lg print:hidden">
        <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isAction = 'isAction' in item && item.isAction;
            const isActive = !isAction && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isAction) {
                    if (onOpenRetroactiveAttendance) onOpenRetroactiveAttendance();
                  } else {
                    handleSelectTab(item.id as ActiveTab);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-red-900 border border-white font-bold shadow-xs'
                    : isAction
                    ? 'text-amber-200 hover:text-white'
                    : 'text-red-200/80 hover:text-white'
                }`}
              >
                <i className={`${item.icon} text-sm mb-0.5 ${isActive ? 'text-red-700' : isAction ? 'text-amber-300' : 'text-red-200'}`}></i>
                <span className="text-[9px] truncate max-w-full font-semibold">
                  {item.id === 'students' ? 'Data Guru' : item.id === 'rekap_dinas' ? 'Rekap' : item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
