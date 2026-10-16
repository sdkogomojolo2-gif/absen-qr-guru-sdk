import React from 'react';
import { CustomFirebaseSettings } from './CustomFirebaseSettings';
import { Student, AttendanceRecord, SystemSettings, Teacher, School } from '../types';

interface CustomFirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  localData?: {
    schools?: School[];
    students: Student[];
    teachers: Teacher[];
    settings: SystemSettings;
    attendanceRecords: AttendanceRecord[];
  };
}

export const CustomFirebaseModal: React.FC<CustomFirebaseModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  localData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs select-none overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-xs">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Pengaturan Firebase Mandiri (BYO Database)
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Hubungkan Cloud Firestore Milik Anda Sendiri Untuk Privasi Data 100%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <CustomFirebaseSettings onShowToast={onShowToast} localData={localData} />
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
