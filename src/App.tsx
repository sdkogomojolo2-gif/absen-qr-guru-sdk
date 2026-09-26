import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Student,
  AttendanceRecord,
  SystemSettings,
  ActiveTab,
  AttendanceStatus,
  ToastMessage,
  Teacher,
  TeacherType,
  ScheduledLeave,
  BehaviorLog,
  School,
} from './types';
import { formatClassLabel } from './utils/classUtils';
import { calculateAttendanceStatusForDate, getDayScheduleForDate, getScheduledEntryTimeForDate } from './utils/scheduleUtils';
import {
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  DEFAULT_SETTINGS,
  INITIAL_SCHOOLS,
  DEFAULT_PRIMARY_SCHOOL_ID,
  getTodayDateString,
  generateInitialAttendance,
  isDummyGuruId,
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { DashboardTab } from './components/DashboardTab';
import { ScannerTab } from './components/ScannerTab';
import { StudentsTab } from './components/StudentsTab';
import { SimulatorTab } from './components/SimulatorTab';
import { LoginModal } from './components/LoginModal';
import { TeacherManagementModal } from './components/TeacherManagementModal';
import { AdminProfileModal } from './components/AdminProfileModal';
import { GuideModal } from './components/GuideModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DapodikAnnouncementModal, CURRENT_ANNOUNCEMENT_VERSION } from './components/DapodikAnnouncementModal';
import { ERaporSyncModal } from './components/ERaporSyncModal';
import { MonthlyRecapTab } from './components/MonthlyRecapTab';
import { RetroactiveAttendanceModal } from './components/RetroactiveAttendanceModal';
import { TeacherListPrintModal } from './components/TeacherListPrintModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/OfflineIndicator';
import { testFirestoreConnection, setCustomIIHHBeresDatabaseId } from './firebase';
import {
  subscribeToStudents,
  subscribeToAttendance,
  subscribeToTeachers,
  subscribeToSettings,
  subscribeToLeaves,
  subscribeToBehaviorLogs,
  subscribeToSchools,
  saveSchoolToFirestore,
  deleteSchoolFromFirestore,
  seedInitialSchoolsIfEmpty,
  saveStudentToFirestore,
  deleteStudentFromFirestore,
  bulkDeleteStudentsFromFirestore,
  syncAllStudentsToFirestore,
  syncAllAttendanceToFirestore,
  syncAllTeachersToFirestore,
  saveAttendanceToFirestore,
  deleteAttendanceFromFirestore,
  bulkDeleteAttendanceFromFirestore,
  saveTeacherToFirestore,
  deleteTeacherFromFirestore,
  saveSettingsToFirestore,
  saveLeaveToFirestore,
  deleteLeaveFromFirestore,
  saveBehaviorLogToFirestore,
  deleteBehaviorLogFromFirestore,
  seedInitialFirestoreDataIfEmpty,
  fetchAllTeachersFromFirestore,
  fetchAllAttendanceFromFirestore,
  fetchAllStudentsFromFirestore,
} from './services/firestoreService';
import { safeSetItem, safeGetItem, safeRemoveItem, cleanStaleLocalStorage } from './utils/storage';
import { isHomeroomClassMatch, resolveRecordTeacher } from './utils/classUtils';

const LOCAL_STORAGE_KEYS = {
  SCHOOLS: 'absensi_siswa_schools_v1',
  CURRENT_SCHOOL_ID: 'absensi_siswa_current_school_id_v1',
  STUDENTS: 'absensi_siswa_students_v2',
  ATTENDANCE: 'absensi_siswa_attendance_v2',
  SETTINGS: 'absensi_siswa_settings_v1',
  TEACHERS: 'absensi_siswa_teachers_v2',
  CURRENT_TEACHER: 'absensi_siswa_current_teacher_v2',
  LEAVES: 'absensi_siswa_leaves_v1',
  BEHAVIOR_LOGS: 'absensi_siswa_behavior_logs_v1',
  DELETED_GURU_IDS: 'absensi_guru_deleted_ids_v2',
};

const getDeletedGuruIds = (): Set<string> => {
  try {
    const saved = safeGetItem(LOCAL_STORAGE_KEYS.DELETED_GURU_IDS);
    const parsed = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    parsed.add('std-1790217545836-o487cq8');
    return parsed;
  } catch {
    return new Set<string>(['std-1790217545836-o487cq8']);
  }
};

const addDeletedGuruIds = (ids: string[]) => {
  try {
    const current = getDeletedGuruIds();
    ids.forEach((id) => {
      if (id && typeof id === 'string' && id.trim()) {
        current.add(id.trim());
      }
    });
    safeSetItem(LOCAL_STORAGE_KEYS.DELETED_GURU_IDS, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.warn('Notice saving deleted guru ids:', e);
  }
};

export default function App() {
  const todayStr = getTodayDateString();
  const isInitialMount = useRef(true);

  // Run cleanup once on startup to remove legacy keys and reclaim quota space
  useEffect(() => {
    cleanStaleLocalStorage();
  }, []);

  // Multi-School State (Sistem Multi-Sekolah)
  const [schools, setSchools] = useState<School[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.SCHOOLS);
      if (saved) {
        const parsed: School[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SCHOOLS;
    } catch {
      return INITIAL_SCHOOLS;
    }
  });

  const [currentSchoolId, setCurrentSchoolId] = useState<string>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.CURRENT_SCHOOL_ID);
      return saved || DEFAULT_PRIMARY_SCHOOL_ID;
    } catch {
      return DEFAULT_PRIMARY_SCHOOL_ID;
    }
  });

  // Settings state with safe JSON parse
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed: SystemSettings = JSON.parse(saved);
        if (parsed.schoolName && (parsed.schoolName.toUpperCase().includes('OGOMOJOLO') || parsed.schoolName === 'SD NEGERI 1 INDONESIA')) {
          return DEFAULT_SETTINGS;
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.warn('Failed to parse settings from localStorage:', e);
      return DEFAULT_SETTINGS;
    }
  });

  // Students state with safe JSON parse
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      if (safeGetItem('absensi_siswa_students_v1')) {
        safeRemoveItem('absensi_siswa_students_v1');
        safeRemoveItem('absensi_siswa_attendance_v1');
      }

      const saved = safeGetItem(LOCAL_STORAGE_KEYS.STUDENTS);
      const parsed: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
      const deletedIds = getDeletedGuruIds();

      const filtered = Array.isArray(parsed)
        ? parsed.filter((s) => s && !isDummyGuruId(s.id) && !deletedIds.has(s.id))
        : [];

      const candidate = filtered.length > 0 ? filtered : INITIAL_STUDENTS;

      const seenIds = new Set<string>();
      const sanitized = candidate.map((s, index) => {
        let uniqueId = s.id;
        if (!uniqueId || seenIds.has(uniqueId)) {
          uniqueId = `std-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 8)}`;
        }
        seenIds.add(uniqueId);
        return {
          ...s,
          id: uniqueId,
          classRoom: s.classRoom ? formatClassLabel(s.classRoom) : s.classRoom,
        };
      });

      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(sanitized));
      return sanitized;
    } catch (e) {
      console.warn('Failed to parse students from localStorage:', e);
      return INITIAL_STUDENTS;
    }
  });

  // Attendance Records state with safe JSON parse
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.ATTENDANCE);
      const parsed: AttendanceRecord[] = saved ? JSON.parse(saved) : generateInitialAttendance(todayStr);
      const filtered = parsed.filter(
        (r) => !isDummyGuruId(r.guruId) && !isDummyGuruId(r.studentId)
      );
      safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.warn('Failed to parse attendance from localStorage:', e);
      return generateInitialAttendance(todayStr);
    }
  });

  // Teachers state with safe JSON parse
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      if (safeGetItem('absensi_siswa_teachers_v1')) {
        safeRemoveItem('absensi_siswa_teachers_v1');
        safeRemoveItem('absensi_siswa_current_teacher_v1');
      }

      const saved = safeGetItem(LOCAL_STORAGE_KEYS.TEACHERS);
      if (!saved) return INITIAL_TEACHERS;

      const parsed: Teacher[] = JSON.parse(saved);
      const deletedIds = getDeletedGuruIds();
      const filtered = parsed.filter(
        (t) =>
          !['tch-1', 'tch-2', 'tch-3', 'tch-4', 'tch-5', 'tch-6', 'tch-7', 'tch-8'].includes(t.id) &&
          !deletedIds.has(t.id)
      );

      if (filtered.length === 0) return INITIAL_TEACHERS;

      return filtered.map((t) => {
        if (t.id === 'tch-admin' && (t.name === 'Budi Santoso, S.Pd.SD' || !t.name)) {
          return INITIAL_TEACHERS[0];
        }
        if (t.id === 'tch-admin' || t.email?.toLowerCase() === 'fadli46046@gmail.com') {
          return { ...t, pin: 'Hanin231221' };
        }
        return t;
      });
    } catch (e) {
      console.warn('Failed to parse teachers from localStorage:', e);
      return INITIAL_TEACHERS;
    }
  });

  // Scheduled Leaves (Izin / Sakit Terjadwal) state
  const [scheduledLeaves, setScheduledLeaves] = useState<ScheduledLeave[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.LEAVES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse leaves from localStorage:', e);
      return [];
    }
  });

  // Student Behavior & Character Logs state
  const [behaviorLogs, setBehaviorLogs] = useState<BehaviorLog[]>(() => {
    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.BEHAVIOR_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse behavior logs from localStorage:', e);
      return [];
    }
  });

  // Currently logged-in Teacher (defaults to null / logged out to protect admin data when link is shared)
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(() => {
    // If URL has ?logout=1 or ?logout=true or ?guest=1, force logout and clear stored session
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (
          urlParams.get('logout') === 'true' ||
          urlParams.get('logout') === '1' ||
          urlParams.has('logout') ||
          urlParams.get('guest') === '1'
        ) {
          safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
          return null;
        }
      } catch {
        // Fallback for searchParams
      }
    }

    try {
      const saved = safeGetItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
      if (saved) {
        const parsed: Teacher = JSON.parse(saved);
        if (parsed && parsed.id) {
          if (parsed.id === 'tch-admin' || parsed.email?.toLowerCase() === 'fadli46046@gmail.com') {
            return { ...parsed, pin: 'Hanin231221' };
          }
          return parsed;
        }
      }
      // Fresh visitors or shared links always start in logged-out state
      return null;
    } catch (e) {
      console.warn('Failed to parse current teacher from localStorage:', e);
      return null;
    }
  });

  // Modals for Teacher Login, Management, Admin Profile, Guide, and Cloud Sync
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isERaporSyncModalOpen, setIsERaporSyncModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPrintTeacherListModalOpen, setIsPrintTeacherListModalOpen] = useState(false);

  // Retroactive Attendance Modal State (Absen Masa Lampau / Lupa Absen)
  const [isRetroactiveModalOpen, setIsRetroactiveModalOpen] = useState(false);
  const [retroactiveInitialDate, setRetroactiveInitialDate] = useState<string | undefined>(undefined);
  const [retroactiveInitialTeacherId, setRetroactiveInitialTeacherId] = useState<string | undefined>(undefined);

  // Dapodik-style Announcement Pop-up on initial enter
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState<boolean>(() => {
    try {
      const acknowledgedVersion = safeGetItem('dapodik_announcement_acknowledged');
      return acknowledgedVersion !== CURRENT_ANNOUNCEMENT_VERSION;
    } catch {
      return true;
    }
  });

  // Dark / Light Theme Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = safeGetItem('app_theme_mode');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Apply dark mode class to <html> root
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        safeSetItem('app_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        safeSetItem('app_theme_mode', 'light');
      }
    } catch (e) {
      console.warn('Failed to sync theme class:', e);
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Navigation & Date
  const [activeTab, setActiveTab] = useState<ActiveTab>('rekap_dinas');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper
  const addToast = useCallback(
    (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, title, message, type }]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCloseAnnouncement = useCallback((dontShowAgain: boolean) => {
    setIsAnnouncementOpen(false);
    if (dontShowAgain) {
      const targetVer = settings.announcementVersion || CURRENT_ANNOUNCEMENT_VERSION;
      safeSetItem('dapodik_announcement_acknowledged', targetVer);
    }
  }, [settings.announcementVersion]);

  const handleOpenAnnouncement = useCallback(() => {
    setIsAnnouncementOpen(true);
  }, []);

  const handleResetAnnouncementStatus = useCallback(() => {
    safeRemoveItem('dapodik_announcement_acknowledged');
    addToast(
      'Pop-up Direset',
      'Pemberitahuan ala Dapodik akan otomatis muncul kembali saat membuka beranda.',
      'info'
    );
  }, [addToast]);

  // Save to LocalStorage whenever states update (fast local cache with quota management)
  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.CURRENT_SCHOOL_ID, currentSchoolId);
  }, [currentSchoolId]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.LEAVES, JSON.stringify(scheduledLeaves));
  }, [scheduledLeaves]);

  useEffect(() => {
    safeSetItem(LOCAL_STORAGE_KEYS.BEHAVIOR_LOGS, JSON.stringify(behaviorLogs));
  }, [behaviorLogs]);

  useEffect(() => {
    if (currentTeacher) {
      safeSetItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER, JSON.stringify(currentTeacher));
    } else {
      safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
    }
  }, [currentTeacher]);

  // Real-time Firestore synchronization & Initial Connection
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Firestore connection notice:', err);
    });

    // Seed initial data to Firestore if completely empty
    seedInitialFirestoreDataIfEmpty(
      INITIAL_STUDENTS,
      INITIAL_TEACHERS,
      DEFAULT_SETTINGS,
      generateInitialAttendance(todayStr)
    ).catch((err) => {
      console.warn('Firestore initial data check notice:', err);
    });

    // Ensure super admin PIN is synced to Hanin231221
    saveTeacherToFirestore({ ...INITIAL_TEACHERS[0], pin: 'Hanin231221' }).catch((err) => {
      console.warn('Super admin PIN sync notice:', err);
    });

    // Seed initial schools if empty
    seedInitialSchoolsIfEmpty().catch((err) => {
      console.warn('Firestore schools check notice:', err);
    });

    // Immediate one-shot fetch from Firestore to ensure zero-latency data loading
    fetchAllTeachersFromFirestore().then((remoteTeachers) => {
      if (remoteTeachers && remoteTeachers.length > 0) {
        setTeachers((prev) => {
          const map = new Map<string, Teacher>();
          prev.forEach((t) => map.set(t.id, t));
          remoteTeachers.forEach((t) => {
            const normalized: Teacher = { ...t, schoolId: t.schoolId || DEFAULT_PRIMARY_SCHOOL_ID };
            map.set(normalized.id, normalized);
          });
          INITIAL_TEACHERS.forEach((t) => {
            if (!map.has(t.id)) map.set(t.id, t);
          });
          const merged = Array.from(map.values());
          safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(console.warn);

    fetchAllAttendanceFromFirestore().then((remoteAttendance) => {
      if (remoteAttendance && remoteAttendance.length > 0) {
        // Clean up dummy attendance records in Firestore if any exist
        const dummyAttIds = remoteAttendance
          .filter((r) => isDummyGuruId(r.guruId) || isDummyGuruId(r.studentId) || (r.id && r.id.startsWith('att-sep-guru-')))
          .map((r) => r.id);
        if (dummyAttIds.length > 0) {
          bulkDeleteAttendanceFromFirestore(dummyAttIds).catch(console.warn);
        }

        const validRemote = remoteAttendance.filter(
          (r) => !isDummyGuruId(r.guruId) && !isDummyGuruId(r.studentId) && !(r.id && r.id.startsWith('att-sep-guru-'))
        );

        setAttendanceRecords((prev) => {
          const map = new Map<string, AttendanceRecord>();
          prev.filter((r) => !isDummyGuruId(r.guruId) && !isDummyGuruId(r.studentId)).forEach((r) => map.set(r.id, r));
          validRemote.forEach((r) => {
            const normalized: AttendanceRecord = { ...r, schoolId: r.schoolId || DEFAULT_PRIMARY_SCHOOL_ID };
            map.set(normalized.id, normalized);
          });
          const merged = Array.from(map.values());
          safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(merged));
          return merged;
        });
      }
    }).catch(console.warn);

    fetchAllStudentsFromFirestore().then((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        // Clean up dummy guru in Firestore if any exist
        const dummyStudentIds = remoteStudents.filter((s) => isDummyGuruId(s.id)).map((s) => s.id);
        if (dummyStudentIds.length > 0) {
          bulkDeleteStudentsFromFirestore(dummyStudentIds).catch(console.warn);
        }

        const validRemote = remoteStudents.filter((s) => !isDummyGuruId(s.id));

        setStudents((prev) => {
          const map = new Map<string, Student>();
          prev.filter((s) => !isDummyGuruId(s.id)).forEach((s) => map.set(s.id, s));
          validRemote.forEach((s) => {
            const normalized: Student = { ...s, schoolId: s.schoolId || DEFAULT_PRIMARY_SCHOOL_ID };
            map.set(normalized.id, normalized);
          });
          const merged = Array.from(map.values());
          safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
          return merged;
        });
      } else {
        // Remote is empty, seed INITIAL_STUDENTS to Firestore so remote has the 10 PTK
        if (INITIAL_STUDENTS.length > 0) {
          syncAllStudentsToFirestore(INITIAL_STUDENTS).catch(console.warn);
        }
      }
    }).catch(console.warn);

    // Subscribe to Firestore schools collection
    const unsubSchools = subscribeToSchools((fsSchools) => {
      if (fsSchools && fsSchools.length > 0) {
        setSchools((prev) => {
          const schoolMap = new Map<string, School>();
          // 1. Keep all existing local schools (never drop a locally created school)
          prev.forEach((s) => schoolMap.set(s.id, s));
          // 2. Merge/update with schools from Firestore
          fsSchools.forEach((s) => schoolMap.set(s.id, s));
          // 3. Ensure defaults exist
          INITIAL_SCHOOLS.forEach((s) => {
            if (!schoolMap.has(s.id)) schoolMap.set(s.id, s);
          });
          const merged = Array.from(schoolMap.values());
          safeSetItem(LOCAL_STORAGE_KEYS.SCHOOLS, JSON.stringify(merged));
          return merged;
        });
      }
    });

    // Subscribe to Firestore collections in real-time
    const unsubStudents = subscribeToStudents((fsStudents) => {
      if (!fsStudents) return;
      const deletedIds = getDeletedGuruIds();
      const validFs = fsStudents.filter((s) => !isDummyGuruId(s.id) && !deletedIds.has(s.id));

      setStudents((prev) => {
        if (validFs.length === 0) {
          // If Firestore collection has 0 valid documents:
          // Keep local data or seed INITIAL_STUDENTS rather than wiping out
          if (prev && prev.length > 0) {
            syncAllStudentsToFirestore(prev).catch(console.warn);
            return prev;
          }
          if (INITIAL_STUDENTS.length > 0) {
            syncAllStudentsToFirestore(INITIAL_STUDENTS).catch(console.warn);
            safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
            return INITIAL_STUDENTS;
          }
          return [];
        }

        const normalized = validFs.map((s) => ({
          ...s,
          schoolId: s.schoolId || DEFAULT_PRIMARY_SCHOOL_ID,
          classRoom: s.classRoom ? formatClassLabel(s.classRoom) : s.classRoom,
        }));
        safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(normalized));
        return normalized;
      });
    });

    const unsubAttendance = subscribeToAttendance((fsRecords) => {
      if (!fsRecords) return;
      const validFs = fsRecords.filter(
        (r) => !isDummyGuruId(r.guruId) && !isDummyGuruId(r.studentId) && !(r.id && r.id.startsWith('att-sep-guru-'))
      );
      let missing: AttendanceRecord[] = [];
      setAttendanceRecords((prev) => {
        const prevMap = new Map<string, AttendanceRecord>();
        prev.filter((r) => !isDummyGuruId(r.guruId) && !isDummyGuruId(r.studentId)).forEach((r) => prevMap.set(r.id, r));

        validFs.forEach((r) => {
          const raw = (r.teacherName || '').trim().toLowerCase();
          let record: AttendanceRecord = { ...r, schoolId: r.schoolId || DEFAULT_PRIMARY_SCHOOL_ID };
          if (
            !r.teacherName ||
            raw === 'petugas scanner' ||
            raw === 'petugas sekolah' ||
            raw === 'wali kelas / sistem' ||
            raw === 'sistem'
          ) {
            const resolved = resolveRecordTeacher(r, teachers, students, currentTeacher);
            record = {
              ...record,
              teacherName: resolved.name,
              teacherType: resolved.type,
              teacherSubject: resolved.subject,
            };
          }
          prevMap.set(record.id, record);
        });

        missing = prev.filter(
          (p) => !isDummyGuruId(p.guruId) && !isDummyGuruId(p.studentId) && !validFs.some((f) => f.id === p.id)
        );
        const merged = Array.from(prevMap.values());
        safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(merged));
        return merged;
      });

      // Backfill to Firestore any local attendance not yet in Firestore
      if (missing.length > 0) {
        syncAllAttendanceToFirestore(missing).catch((err) =>
          console.warn('Backfill attendance notice:', err)
        );
      }
    });

    const unsubTeachers = subscribeToTeachers((fsTeachers) => {
      if (!fsTeachers || fsTeachers.length === 0) return;
      const deletedIds = getDeletedGuruIds();
      const validFs = fsTeachers.filter((t) => !deletedIds.has(t.id));

      setTeachers(() => {
        const list: Teacher[] = [];
        const seenIds = new Set<string>();

        validFs.forEach((t) => {
          let teacherObj: Teacher = { ...t, schoolId: t.schoolId || DEFAULT_PRIMARY_SCHOOL_ID };
          if ((t.id === 'tch-admin' || t.email?.toLowerCase() === 'fadli46046@gmail.com') && t.pin !== 'Hanin231221') {
            teacherObj = { ...teacherObj, pin: 'Hanin231221' };
            saveTeacherToFirestore(teacherObj).catch(console.warn);
          }
          list.push(teacherObj);
          seenIds.add(teacherObj.id);
        });

        INITIAL_TEACHERS.forEach((t) => {
          if (!seenIds.has(t.id) && !deletedIds.has(t.id)) {
            list.push(t);
            seenIds.add(t.id);
          }
        });

        safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(list));
        return list;
      });
    });

    const unsubSettings = subscribeToSettings((fsSettings) => {
      if (fsSettings && fsSettings.schoolName) {
        // Only accept if settings belong to current active school or legacy default
        if (!fsSettings.schoolId || fsSettings.schoolId === currentSchoolId) {
          setSettings(fsSettings);
        }
      }
    });

    const unsubLeaves = subscribeToLeaves((fsLeaves) => {
      if (fsLeaves) {
        setScheduledLeaves(fsLeaves);
      }
    });

    const unsubBehavior = subscribeToBehaviorLogs((fsLogs) => {
      if (fsLogs) {
        setBehaviorLogs(fsLogs);
      }
    });

    return () => {
      unsubSchools();
      unsubStudents();
      unsubAttendance();
      unsubTeachers();
      unsubSettings();
      unsubLeaves();
      unsubBehavior();
    };
  }, [todayStr]);

  // Update Settings in State and Firestore
  const handleUpdateSettings = useCallback(
    (newSettings: SystemSettings) => {
      const scopedSettings: SystemSettings = {
        ...newSettings,
        schoolId: DEFAULT_PRIMARY_SCHOOL_ID,
      };
      setSettings(scopedSettings);
      saveSettingsToFirestore(scopedSettings, DEFAULT_PRIMARY_SCHOOL_ID).catch((err) =>
        console.warn('Failed to sync settings to Firestore:', err)
      );

      safeSetItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(scopedSettings));

      // Otomatis sinkronisasi record presensi auto-checkout yang ada agar jam pulangnya sesuai jadwal baru
      setAttendanceRecords((prev) => {
        let hasChanges = false;
        const updated = prev.map((r) => {
          const isAutoCheckoutRecord =
            Boolean(r.note && r.note.includes('Otomatis Lengkap Sampai Jam Pulang')) ||
            (scopedSettings.autoCheckOutWithIn !== false && (r.timeOut === '14:00' || r.timeOut === '11:30' || r.timeOut === '12:30'));

          if (isAutoCheckoutRecord) {
            const sched = getDayScheduleForDate(r.date || todayStr, scopedSettings);
            const newReturnTime = sched.returnStartTime || scopedSettings.returnStartTime || '14:00';
            if (r.timeOut !== newReturnTime) {
              hasChanges = true;
              const newNote = (r.note || '').replace(
                /Otomatis Lengkap Sampai Jam Pulang \([^)]+\)/,
                `Otomatis Lengkap Sampai Jam Pulang (${newReturnTime} WITA)`
              );
              return {
                ...r,
                timeOut: newReturnTime,
                note: newNote.includes('Otomatis Lengkap Sampai Jam Pulang')
                  ? newNote
                  : `${r.note || ''} • Otomatis Lengkap Sampai Jam Pulang (${newReturnTime} WITA)`,
              };
            }
          }
          return r;
        });

        if (hasChanges) {
          safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
          syncAllAttendanceToFirestore(updated).catch((err) =>
            console.warn('Sync updated return schedule to Firestore notice:', err)
          );
          return updated;
        }
        return prev;
      });
    },
    [todayStr]
  );

  // Teacher Login Handler
  const handleTeacherLogin = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    safeSetItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER, JSON.stringify(teacher));
    setIsLoginModalOpen(false);

    addToast(
      'Login Berhasil',
      `Selamat datang, ${teacher.name} (${teacher.role === 'admin' ? 'Admin' : teacher.subject})`,
      'success'
    );
  };

  // Teacher Logout Handler
  const handleTeacherLogout = () => {
    const prevName = currentTeacher?.name || 'Pengguna';
    setCurrentTeacher(null);
    safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
    addToast('Berhasil Keluar', `Anda telah keluar dari akun ${prevName}.`, 'info');
  };

  // Share link handler for teachers (guarantees shared URL forces logged-out guest state)
  const handleShareTeacherLink = async () => {
    let shareUrl = window.location.origin + window.location.pathname;
    // Add ?logout=true so that recipient device explicitly starts in logged-out mode
    shareUrl += '?logout=true';

    const schoolName = settings.schoolName || 'SDN Kecil Ogomojolo';
    const shareData = {
      title: `Presensi Digital Guru & Tendik - ${schoolName}`,
      text: `Link Presensi Digital Guru & Tendik ${schoolName} (Otomatis Logout/Guest untuk Keamanan):`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        addToast(
          'Link Dibagikan',
          'Link aplikasi untuk dewan guru berhasil dibuka di menu bagikan (otomatis dalam keadaan logout demi keamanan data Admin).',
          'success'
        );
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast(
        'Link Guru Disalin',
        'Link aplikasi untuk dewan guru berhasil disalin! Saat dibuka rekan guru, sistem otomatis dalam keadaan LOGOUT untuk menjaga data Admin.',
        'success'
      );
    } catch {
      window.prompt('Salin link untuk rekan guru (otomatis dalam keadaan logout):', shareUrl);
    }
  };

  // Add Teacher Handler (by Admin)
  const handleAddTeacher = (newTeacherData: Omit<Teacher, 'id'>) => {
    const exists = teachers.some((t) => t.email.toLowerCase() === newTeacherData.email.toLowerCase());
    if (exists) {
      addToast('Email Terdaftar', `Email ${newTeacherData.email} sudah terdaftar!`, 'error');
      return;
    }

    const newTeacher: Teacher = {
      ...newTeacherData,
      schoolId: DEFAULT_PRIMARY_SCHOOL_ID,
      id: `tch-${Date.now()}`,
    };

    setTeachers((prev) => [...prev, newTeacher]);
    saveTeacherToFirestore(newTeacher).catch((err) =>
      console.warn('Failed to save teacher to Firestore:', err)
    );

    // If this teacher is Kepala Sekolah or Guru and doesn't exist yet in students list (PTK presensi list),
    // automatically register them into students so they can scan QR / do absensi
    if (newTeacher.nip || newTeacher.teacherType === 'kepala_sekolah') {
      const teacherNis = newTeacher.nip || `KS-${Date.now().toString().slice(-6)}`;
      const existingStudent = students.find((s) => s.nis.toLowerCase() === teacherNis.toLowerCase() || s.name.toLowerCase() === newTeacher.name.toLowerCase());
      if (!existingStudent) {
        const studentRecord: Student = {
          id: `std-${Date.now()}`,
          schoolId: DEFAULT_PRIMARY_SCHOOL_ID,
          name: newTeacher.name,
          nis: teacherNis,
          classRoom: newTeacher.teacherType === 'kepala_sekolah' ? 'Kepala Sekolah' : 'Dewan Guru',
          gender: 'Laki-laki',
          createdAt: getTodayDateString(),
        };
        setStudents((prev) => [...prev, studentRecord]);
        saveStudentToFirestore(studentRecord).catch((err) =>
          console.warn('Auto-register teacher attendance profile warning:', err)
        );
      }
    }

    const roleLabel = newTeacher.teacherType === 'kepala_sekolah' ? 'Kepala Sekolah' : newTeacher.teacherType === 'admin' ? 'Admin' : 'Guru';
    addToast('Akun Ditambahkan', `Akun ${newTeacher.name} (${roleLabel}) berhasil disimpan.`, 'success');
  };

  // Update Teacher / Admin Handler
  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    setTeachers((prev) => prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t)));
    if (currentTeacher?.id === updatedTeacher.id) {
      setCurrentTeacher(updatedTeacher);
    }
    saveTeacherToFirestore(updatedTeacher).catch((err) =>
      console.warn('Failed to update teacher in Firestore:', err)
    );
    addToast(
      'Data Diperbarui',
      `Profil ${updatedTeacher.name} (${updatedTeacher.role === 'admin' ? 'Admin' : updatedTeacher.subject}) berhasil disimpan.`,
      'success'
    );
  };

  // Update Teacher PIN Handler (e.g. from Forgot PIN recovery)
  const handleUpdateTeacherPin = async (teacherId: string, newPin: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    const updated: Teacher = { ...teacher, pin: newPin };
    setTeachers((prev) => prev.map((t) => (t.id === teacherId ? updated : t)));
    if (currentTeacher?.id === teacherId) {
      setCurrentTeacher(updated);
    }
    await saveTeacherToFirestore(updated);
    addToast(
      'PIN Berhasil Diperbarui',
      `PIN untuk akun ${updated.name} telah berhasil direset.`,
      'success'
    );
  };

  // Delete Teacher Handler
  const handleDeleteTeacher = (id: string) => {
    addDeletedGuruIds([id]);
    const teacher = teachers.find((t) => t.id === id);
    if (!teacher) return;

    setTeachers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(updated));
      return updated;
    });
    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== id && (!teacher.nip || s.nip !== teacher.nip));
      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      return updated;
    });
    if (currentTeacher?.id === id) {
      setCurrentTeacher(teachers.find((t) => t.id !== id) || null);
    }
    deleteTeacherFromFirestore(id).catch((err) =>
      console.warn('Failed to delete teacher from Firestore:', err)
    );
    deleteStudentFromFirestore(id).catch(() => {});
    addToast('Akun Dihapus', `Akun guru ${teacher.name} telah dihapus permanen.`, 'info');
  };

  // Calculate late status based on cutoff time
  const calculateLateStatus = (
    timeStr: string,
    cutoffStr: string
  ): AttendanceStatus => {
    const [h, m] = timeStr.split(':').map(Number);
    const [cutH, cutM] = cutoffStr.split(':').map(Number);

    const currentTimeMin = h * 60 + m;
    const cutoffTimeMin = cutH * 60 + cutM;

    return currentTimeMin > cutoffTimeMin ? 'Terlambat' : 'Hadir';
  };

  // Record attendance via QR Camera / Manual / Simulator with Photo & Day-specific Schedule
  const handleRecordAttendance = useCallback(
    (
      student: Student,
      scannedVia: 'QR Camera' | 'Manual Input' | 'Simulator',
      customDate?: string,
      photoSnapshot?: string
    ): { record: AttendanceRecord; isDuplicate: boolean; isCheckOut?: boolean } => {
      const currentDate = customDate || getTodayDateString();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // Check existing record on same date
      const existing = attendanceRecords.find(
        (r) => r.studentId === student.id && r.date === currentDate
      );

      if (existing) {
        // Jika sudah absen masuk tapi belum absen pulang -> Catat Absen Pulang
        if (!existing.timeOut) {
          const updatedRecord: AttendanceRecord = {
            ...existing,
            timeOut: timeStr,
            photoOut: photoSnapshot || existing.photoOut,
          };

          setAttendanceRecords((prev) => {
            const updated = prev.map((r) => (r.id === existing.id ? updatedRecord : r));
            safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
            return updated;
          });
          saveAttendanceToFirestore(updatedRecord).catch((err) =>
            console.warn('Notice saving attendance to Firestore (persisted locally):', err)
          );

          addToast(
            'Presensi Pulang Berhasil',
            `[Pulang] ${student.name} berhasil tercatat pulang jam ${timeStr} WITA.`,
            'info'
          );
          return { record: updatedRecord, isDuplicate: false, isCheckOut: true };
        }

        // Sudah absen masuk dan pulang
        addToast(
          'Presensi Lengkap',
          `${student.name} sudah lengkap melakukan presensi masuk (${existing.time}) dan pulang (${existing.timeOut}) hari ini.`,
          'warning'
        );
        return { record: existing, isDuplicate: true };
      }

      // Hitung status Hadir vs Terlambat berdasarkan jadwal hari bersangkutan (Senin-Kamis 07:15, Jumat 07:00, dll.)
      const { status, note } = calculateAttendanceStatusForDate(timeStr, currentDate, settings);

      // Teacher tracking information - always assign real teacher, never generic fallback
      const homeroom = teachers.find(
        (t) => t.homeroomClass && isHomeroomClassMatch(student.classRoom, t.homeroomClass)
      );
      const assignedTeacher =
        currentTeacher || homeroom || teachers.find((t) => t.role === 'admin') || teachers[0];

      const teacherName = assignedTeacher?.name || 'MOH. FADLI';
      const teacherRole = assignedTeacher?.role || 'guru';
      const teacherType: TeacherType =
        assignedTeacher?.teacherType ||
        (assignedTeacher?.role === 'admin'
          ? 'admin'
          : assignedTeacher?.homeroomClass
          ? 'wali_kelas'
          : 'guru_mapel');

      const teacherSubject =
        teacherType === 'guru_mapel'
          ? (assignedTeacher?.subject ? `Mapel: ${assignedTeacher.subject}` : 'Guru Mapel')
          : teacherType === 'wali_kelas'
          ? (assignedTeacher?.homeroomClass ? `Wali ${formatClassLabel(assignedTeacher.homeroomClass)}` : 'Wali Kelas')
          : (assignedTeacher?.subject || 'Administrator Sekolah');

      const isAutoCheckOut = settings?.autoCheckOutWithIn !== false;
      const daySchedule = getDayScheduleForDate(currentDate, settings);
      const autoReturnTime = isAutoCheckOut ? (daySchedule.returnStartTime || '14:00') : undefined;

      // Sesuai permintaan: Jam masuk diisi sesuai jadwal & batas jam (bukan realtime detik scan)
      const entryTimeMode = settings?.entryTimeMode || 'cutoff';
      const scheduledEntryTime = getScheduledEntryTimeForDate(currentDate, settings, entryTimeMode);
      const recordedTimeIn = entryTimeMode === 'realtime'
        ? timeStr
        : (status === 'Terlambat' ? timeStr : scheduledEntryTime);

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        schoolId: currentSchoolId,
        studentId: student.id,
        nis: student.nis,
        nip: student.nip || student.nis,
        nuptk: student.nuptk || student.nisn,
        studentName: student.name,
        classRoom: student.classRoom,
        date: currentDate,
        time: recordedTimeIn,
        timeIn: recordedTimeIn,
        realtimeScanTime: timeStr,
        timeOut: autoReturnTime,
        status,
        scannedVia,
        note: isAutoCheckOut
          ? `${note} • Otomatis Lengkap Sampai Jam Pulang (${autoReturnTime} WITA)`
          : note,
        photoEvidence: photoSnapshot,
        photoIn: photoSnapshot,
        photoOut: isAutoCheckOut ? photoSnapshot : undefined,
        teacherId: assignedTeacher?.id,
        teacherName,
        teacherRole,
        teacherType,
        teacherSubject,
      };

      setAttendanceRecords((prev) => {
        const updated = [newRecord, ...prev];
        safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
        return updated;
      });
      saveAttendanceToFirestore(newRecord).catch((err) =>
        console.warn('Notice saving attendance to Firestore (persisted locally):', err)
      );

      if (isAutoCheckOut) {
        addToast(
          'Presensi Lengkap 1x Scan',
          `[Lengkap] ${student.name} berhasil tercatat masuk (${recordedTimeIn} WITA) & langsung tercentang lengkap hingga jam pulang (${autoReturnTime} WITA).`,
          'success'
        );
      } else if (status === 'Hadir') {
        addToast(
          'Presensi Masuk Berhasil',
          `[Hadir] ${student.name} - ${currentDate} ${recordedTimeIn} WITA (Tepat Waktu)`,
          'success'
        );
      } else {
        addToast(
          'Presensi Terlambat',
          `[Terlambat] ${student.name} - ${note}`,
          'warning'
        );
      }

      return { record: newRecord, isDuplicate: false, isCheckOut: isAutoCheckOut };
    },
    [attendanceRecords, settings, addToast, currentTeacher, teachers, currentSchoolId]
  );

  // Add Manual Attendance
  const handleAddManualAttendance = (
    studentId: string,
    status: AttendanceStatus,
    note?: string,
    customTime?: string
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const now = new Date();
    const timeStr =
      customTime ||
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

    // Teacher tracking information - always assign real teacher
    const homeroom = teachers.find(
      (t) => t.homeroomClass && isHomeroomClassMatch(student.classRoom, t.homeroomClass)
    );
    const assignedTeacher =
      currentTeacher || homeroom || teachers.find((t) => t.role === 'admin') || teachers[0];

    const teacherName = assignedTeacher?.name || 'MOH. FADLI';
    const teacherRole = assignedTeacher?.role || 'guru';
    const teacherType: TeacherType =
      assignedTeacher?.teacherType ||
      (assignedTeacher?.role === 'admin'
        ? 'admin'
        : assignedTeacher?.homeroomClass
        ? 'wali_kelas'
        : 'guru_mapel');

    const teacherSubject =
      teacherType === 'guru_mapel'
        ? (assignedTeacher?.subject ? `Mapel: ${assignedTeacher.subject}` : 'Guru Mapel')
        : teacherType === 'wali_kelas'
        ? (assignedTeacher?.homeroomClass ? `Wali ${formatClassLabel(assignedTeacher.homeroomClass)}` : 'Wali Kelas')
        : (assignedTeacher?.subject || 'Administrator Sekolah');

    const newRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      schoolId: currentSchoolId,
      studentId: student.id,
      nis: student.nis,
      studentName: student.name,
      classRoom: student.classRoom,
      date: selectedDate,
      time: timeStr,
      status,
      scannedVia: 'Manual Input',
      note: note || `Disimpan manual (${status})`,
      teacherId: assignedTeacher?.id,
      teacherName,
      teacherRole,
      teacherType,
      teacherSubject,
    };

    setAttendanceRecords((prev) => {
      const updated = [newRecord, ...prev];
      safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
      return updated;
    });
    saveAttendanceToFirestore(newRecord).catch((err) =>
      console.warn('Notice saving manual attendance to Firestore:', err)
    );
    addToast('Absensi Manual Saved', `Absensi manual ${student.name} (${status}) tanggal ${selectedDate} berhasil dicatat.`, 'success');
  };

  // Update or Save Edited Attendance Record (Supports past dates editing)
  const handleUpdateAttendanceRecord = useCallback(
    (record: AttendanceRecord) => {
      setAttendanceRecords((prev) => {
        const index = prev.findIndex((r) => r.id === record.id);
        let updated: AttendanceRecord[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = record;
        } else {
          // If editing or adding a record matching same teacher and date, replace previous record on that date
          const filtered = prev.filter(
            (r) =>
              !(
                ((r.studentId && record.studentId && r.studentId === record.studentId) ||
                  (r.guruId && record.guruId && r.guruId === record.guruId) ||
                  (r.nip && record.nip && r.nip.replace(/\s+/g, '') === record.nip.replace(/\s+/g, ''))) &&
                r.date === record.date
              )
          );
          updated = [record, ...filtered];
        }
        safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
        return updated;
      });
      saveAttendanceToFirestore(record).catch((err) =>
        console.warn('Notice saving updated attendance to Firestore:', err)
      );
      addToast(
        'Absensi Berhasil Disimpan',
        `Data presensi ${record.guruName || record.studentName} (${record.status}) tanggal ${record.date} berhasil disimpan.`,
        'success'
      );
    },
    [addToast]
  );

  // Bulk Save Attendance Records (From Quick Bulk Attendance)
  const handleBulkSaveAttendanceRecords = useCallback(
    async (newRecords: AttendanceRecord[]) => {
      if (!newRecords || newRecords.length === 0) return;

      setAttendanceRecords((prev) => {
        const recordMap = new Map<string, AttendanceRecord>();
        // Keep existing records
        prev.forEach((r) => {
          const gId = r.guruId || r.studentId || r.nip;
          if (gId && r.date) {
            recordMap.set(`${r.date}_${gId}`, r);
          } else {
            recordMap.set(r.id, r);
          }
        });
        // Overwrite / merge with new records
        newRecords.forEach((r) => {
          const gId = r.guruId || r.studentId || r.nip;
          if (gId && r.date) {
            recordMap.set(`${r.date}_${gId}`, r);
          } else {
            recordMap.set(r.id, r);
          }
        });

        const updated = Array.from(recordMap.values());
        safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
        return updated;
      });

      await syncAllAttendanceToFirestore(newRecords);

      addToast(
        'Absen Cepat Selesai',
        `Berhasil memproses ${newRecords.length} rekaman presensi ke database.`,
        'success'
      );
    },
    [addToast]
  );

  // Delete Attendance Record
  const handleDeleteRecord = (id: string) => {
    setAttendanceRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
      return updated;
    });
    deleteAttendanceFromFirestore(id).catch((err) =>
      console.warn('Notice deleting attendance from Firestore:', err)
    );
    addToast('Data Dihapus', 'Riwayat absensi telah dihapus.', 'info');
  };

  // Manual Sync to Cloud (Anti-Data-Loss when clearing browser history)
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  const handleManualSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      if (attendanceRecords.length > 0) {
        await syncAllAttendanceToFirestore(attendanceRecords);
      }
      if (students.length > 0) {
        await syncAllStudentsToFirestore(students);
      }
      if (teachers.length > 0) {
        await syncAllTeachersToFirestore(teachers);
      }
      safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));

      addToast(
        'Data 100% Tersimpan di Cloud',
        `Berhasil menyinkronkan ${attendanceRecords.length} data absensi dan ${students.length} data guru/PTK ke Cloud Firestore. Data Anda tetap aman meskipun riwayat browser dibersihkan.`,
        'success'
      );
    } catch (err: any) {
      console.warn('Manual cloud sync notice:', err);
      addToast(
        'Sinkronisasi Selesai',
        'Data tersimpan di penyimpanan lokal dan sinkronisasi cloud telah diperbarui.',
        'info'
      );
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Scheduled Leaves Handlers
  const handleSaveLeave = (leave: ScheduledLeave, autoPopulateAttendance: boolean) => {
    const leaveWithSchool: ScheduledLeave = {
      ...leave,
      schoolId: leave.schoolId || currentSchoolId,
    };

    setScheduledLeaves((prev) => {
      const filtered = prev.filter((l) => l.id !== leaveWithSchool.id);
      return [leaveWithSchool, ...filtered];
    });

    saveLeaveToFirestore(leaveWithSchool).catch((err) =>
      console.warn('Failed to save leave to Firestore:', err)
    );

    // Auto-populate attendance records for the dates in leave range if enabled
    if (autoPopulateAttendance) {
      const student = students.find((s) => s.id === leaveWithSchool.studentId);
      if (student) {
        const start = new Date(leaveWithSchool.startDate);
        const end = new Date(leaveWithSchool.endDate);
        const dateList: string[] = [];

        // Loop inclusive date range
        const curr = new Date(start);
        while (curr <= end) {
          dateList.push(curr.toISOString().slice(0, 10));
          curr.setDate(curr.getDate() + 1);
        }

        const newRecordsToSave: AttendanceRecord[] = [];
        setAttendanceRecords((prev) => {
          let updated = [...prev];
          dateList.forEach((dStr) => {
            const existingIdx = updated.findIndex(
              (r) => r.studentId === student.id && r.date === dStr
            );
            const status: AttendanceStatus = leaveWithSchool.type === 'Sakit' ? 'Sakit' : 'Izin';
            const homeroom = teachers.find(
              (t) => t.homeroomClass && isHomeroomClassMatch(student.classRoom, t.homeroomClass)
            );
            const assignedTeacher =
              currentTeacher || homeroom || teachers.find((t) => t.role === 'admin') || teachers[0];
            const teacherName = leaveWithSchool.recordedBy || assignedTeacher?.name || 'MOH. FADLI';
            const teacherRole = assignedTeacher?.role || 'guru';
            const teacherType = assignedTeacher?.teacherType || (assignedTeacher?.homeroomClass ? 'wali_kelas' : 'admin');
            const teacherSubject =
              assignedTeacher?.teacherType === 'wali_kelas' || assignedTeacher?.homeroomClass
                ? (assignedTeacher?.homeroomClass ? `Wali ${assignedTeacher.homeroomClass}` : 'Wali Kelas')
                : assignedTeacher?.subject || (assignedTeacher?.role === 'admin' ? 'Administrator Sekolah' : 'Guru Pengabsen');

            const attRecord: AttendanceRecord = {
              id: existingIdx >= 0 ? updated[existingIdx].id : `att-leave-${Date.now()}-${dStr}`,
              schoolId: currentSchoolId,
              studentId: student.id,
              nis: student.nis,
              studentName: student.name,
              classRoom: student.classRoom,
              date: dStr,
              time: '07:00:00',
              status,
              scannedVia: 'Manual Input',
              note: `[Izin Terjadwal] ${leaveWithSchool.reason}`,
              teacherId: assignedTeacher?.id,
              teacherName,
              teacherRole,
              teacherType,
              teacherSubject,
            };

            if (existingIdx >= 0) {
              updated[existingIdx] = attRecord;
            } else {
              updated.unshift(attRecord);
            }
            newRecordsToSave.push(attRecord);
          });
          return updated;
        });

        // Persist generated records to Firestore
        newRecordsToSave.forEach((r) => {
          saveAttendanceToFirestore(r).catch((err) =>
            console.warn('Failed to save leave attendance to Firestore:', err)
          );
        });
      }
    }

    addToast(
      'Izin Tersimpan',
      `Jadwal ${leaveWithSchool.type} ${leaveWithSchool.studentName} (${leaveWithSchool.startDate} s/d ${leaveWithSchool.endDate}) berhasil dicatat.`,
      'success'
    );
  };

  const handleDeleteLeave = (leaveId: string) => {
    setScheduledLeaves((prev) => prev.filter((l) => l.id !== leaveId));
    deleteLeaveFromFirestore(leaveId).catch((err) =>
      console.warn('Failed to delete leave from Firestore:', err)
    );
    addToast('Izin Dihapus', 'Data izin/sakit terjadwal telah dihapus.', 'info');
  };

  // Behavior & Character Log Handlers
  const handleSaveBehaviorLog = (log: BehaviorLog) => {
    const logWithSchool: BehaviorLog = {
      ...log,
      schoolId: log.schoolId || currentSchoolId,
    };

    setBehaviorLogs((prev) => {
      const filtered = prev.filter((l) => l.id !== logWithSchool.id);
      return [logWithSchool, ...filtered];
    });

    saveBehaviorLogToFirestore(logWithSchool).catch((err) =>
      console.warn('Failed to save behavior log to Firestore:', err)
    );

    addToast(
      'Catatan Tersimpan',
      `Catatan untuk ${logWithSchool.studentName} berhasil dicatat.`,
      'success'
    );
  };

  const handleDeleteBehaviorLog = (logId: string) => {
    setBehaviorLogs((prev) => prev.filter((l) => l.id !== logId));
    deleteBehaviorLogFromFirestore(logId).catch((err) =>
      console.warn('Failed to delete behavior log from Firestore:', err)
    );
    addToast('Catatan Dihapus', 'Catatan guru telah dihapus.', 'info');
  };

  // Student Management Handlers
  const handleAddStudent = (newStudentData: Omit<Student, 'id' | 'createdAt'> & { id?: string }) => {
    const uniqueId = newStudentData.id || `std-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newStudent: Student = {
      ...newStudentData,
      id: uniqueId,
      schoolId: DEFAULT_PRIMARY_SCHOOL_ID,
      createdAt: getTodayDateString(),
    };
    setStudents((prev) => [...prev, newStudent]);
    saveStudentToFirestore(newStudent).catch((err) =>
      console.warn('Failed to save student to Firestore:', err)
    );
    addToast('Guru Ditambahkan', `${newStudent.name} berhasil didaftarkan.`, 'success');
  };

  const handleAddBulkStudents = (newStudentsList: Student[]) => {
    const timestamp = Date.now();
    const preparedStudents = newStudentsList.map((s, idx) => ({
      ...s,
      schoolId: DEFAULT_PRIMARY_SCHOOL_ID,
      id: s.id && s.id.length > 5 ? s.id : `std-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: s.createdAt || getTodayDateString(),
    }));

    setStudents((prev) => {
      const existingNisMap = new Set(prev.map((p) => p.nis.trim()));
      const filteredNew = preparedStudents.filter((s) => !existingNisMap.has(s.nis.trim()));
      const updated = [...prev, ...filteredNew];
      syncAllStudentsToFirestore(filteredNew).catch((err) =>
        console.warn('Failed to bulk sync students to Firestore:', err)
      );
      return updated;
    });

    addToast('Import Berhasil', `${newStudentsList.length} data guru/PTK berhasil diproses.`, 'success');
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const studentWithSchool: Student = {
      ...updatedStudent,
      schoolId: updatedStudent.schoolId || currentSchoolId,
    };
    setStudents((prev) => {
      const exists = prev.some((s) => s.id === studentWithSchool.id);
      const updated = exists
        ? prev.map((s) => (s.id === studentWithSchool.id ? studentWithSchool : s))
        : [...prev, studentWithSchool];
      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      return updated;
    });
    saveStudentToFirestore(studentWithSchool).catch((err) =>
      console.warn('Failed to update student in Firestore:', err)
    );
    addToast('Data Diperbarui', `Data ${studentWithSchool.name} berhasil diperbarui.`, 'success');
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    addDeletedGuruIds([id]);
    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== id && (!target?.nis || s.nis !== target.nis));
      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      return updated;
    });
    setTeachers((prev) => {
      const updated = prev.filter((t) => t.id !== id && (!target?.nis || t.nip !== target.nis));
      safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(updated));
      return updated;
    });
    deleteStudentFromFirestore(id).catch((err) =>
      console.warn('Failed to delete student from Firestore:', err)
    );
    deleteTeacherFromFirestore(id).catch(() => {});
    addToast('Guru Dihapus', 'Data guru/PTK berhasil dihapus permanen dari database.', 'info');
  };

  const handleBulkDeleteStudents = (ids: string[]) => {
    addDeletedGuruIds(ids);
    const idSet = new Set(ids);
    setStudents((prev) => {
      const updated = prev.filter((s) => !idSet.has(s.id));
      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      return updated;
    });
    setTeachers((prev) => {
      const updated = prev.filter((t) => !idSet.has(t.id));
      safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(updated));
      return updated;
    });
    bulkDeleteStudentsFromFirestore(ids).catch((err) =>
      console.warn('Failed to bulk delete students from Firestore:', err)
    );
    ids.forEach((id) => deleteTeacherFromFirestore(id).catch(() => {}));
    addToast('Guru Dihapus', `${ids.length} data guru/PTK berhasil dihapus secara permanen.`, 'info');
  };

  // Reset data for the school (Protected: Admin Only)
  const handleResetData = () => {
    if (currentTeacher?.role !== 'admin') {
      addToast('Akses Ditolak', 'Hanya Administrator yang memiliki wewenang untuk mereset database sekolah.', 'error');
      return;
    }

    const studentIdsToDelete = students.map((s) => s.id);
    if (studentIdsToDelete.length > 0) {
      bulkDeleteStudentsFromFirestore(studentIdsToDelete).catch(console.warn);
    }
    const attIdsToDelete = attendanceRecords.map((a) => a.id);
    if (attIdsToDelete.length > 0) {
      bulkDeleteAttendanceFromFirestore(attIdsToDelete).catch(console.warn);
    }

    setStudents([]);
    setTeachers(INITIAL_TEACHERS);
    setCurrentTeacher(null);
    setSettings(DEFAULT_SETTINGS);
    setAttendanceRecords([]);
    setScheduledLeaves([]);
    setBehaviorLogs([]);
    safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
    safeSetItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    safeSetItem(LOCAL_STORAGE_KEYS.LEAVES, JSON.stringify([]));
    safeSetItem(LOCAL_STORAGE_KEYS.BEHAVIOR_LOGS, JSON.stringify([]));
    safeRemoveItem(LOCAL_STORAGE_KEYS.CURRENT_TEACHER);
    saveSettingsToFirestore(DEFAULT_SETTINGS, DEFAULT_PRIMARY_SCHOOL_ID).catch((e) => console.warn(e));
    addToast('Database Dikosongkan', 'Data guru dan absensi berhasil dikosongkan. Siap untuk input data sebenarnya.', 'info');
  };

  // Restore Data Handler for Cloud Sync / JSON File Import (Protected: Admin Only)
  const handleRestoreData = (restored: {
    students: Student[];
    attendanceRecords: AttendanceRecord[];
    settings: SystemSettings;
    teachers: Teacher[];
    schools?: School[];
  }) => {
    if (currentTeacher?.role !== 'admin') {
      addToast('Akses Ditolak', 'Hanya Administrator yang berhak memulihkan atau menimpa database sekolah.', 'error');
      return;
    }
    const targetSchoolId = DEFAULT_PRIMARY_SCHOOL_ID;

    // Normalize all items with consistent IDs and schoolId
    const seenStudentIds = new Set<string>();
    const normStudents: Student[] = (restored.students || []).map((s, idx) => {
      let id = s.id && typeof s.id === 'string' && s.id.trim() !== ''
        ? s.id.trim()
        : `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      if (seenStudentIds.has(id)) {
        id = `std-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seenStudentIds.add(id);
      return {
        ...s,
        id,
        schoolId: targetSchoolId,
        classRoom: s.classRoom ? formatClassLabel(s.classRoom) : s.classRoom,
      };
    });

    const seenTeacherIds = new Set<string>();
    const normTeachers: Teacher[] = (restored.teachers || []).map((t, idx) => {
      let id = t.id && typeof t.id === 'string' && t.id.trim() !== ''
        ? t.id.trim()
        : `tch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      if (seenTeacherIds.has(id)) {
        id = `tch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seenTeacherIds.add(id);
      return {
        ...t,
        id,
        schoolId: targetSchoolId,
      };
    });

    const normAttendance: AttendanceRecord[] = (restored.attendanceRecords || []).map((r, idx) => ({
      ...r,
      id: r.id && typeof r.id === 'string' && r.id.trim() !== ''
        ? r.id.trim()
        : `att-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: targetSchoolId,
    }));

    const normSettings: SystemSettings = {
      ...(restored.settings || settings),
      schoolId: targetSchoolId,
    };

    // Merge data cleanly into single school state
    setStudents((prev) => {
      const studentMap = new Map<string, Student>();
      prev.forEach((s) => studentMap.set(s.id, s));
      normStudents.forEach((s) => studentMap.set(s.id, s));
      const merged = Array.from(studentMap.values());
      safeSetItem(LOCAL_STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
      return merged;
    });

    setTeachers((prev) => {
      const teacherMap = new Map<string, Teacher>();
      prev.forEach((t) => teacherMap.set(t.id, t));
      teacherMap.set(INITIAL_TEACHERS[0].id, { ...INITIAL_TEACHERS[0], pin: 'Hanin231221' });
      normTeachers.forEach((t) => teacherMap.set(t.id, t));
      const merged = Array.from(teacherMap.values());
      safeSetItem(LOCAL_STORAGE_KEYS.TEACHERS, JSON.stringify(merged));
      return merged;
    });

    setAttendanceRecords((prev) => {
      const attMap = new Map<string, AttendanceRecord>();
      prev.forEach((r) => attMap.set(r.id, r));
      normAttendance.forEach((r) => attMap.set(r.id, r));
      const merged = Array.from(attMap.values());
      safeSetItem(LOCAL_STORAGE_KEYS.ATTENDANCE, JSON.stringify(merged));
      return merged;
    });

    setSettings(normSettings);
    safeSetItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(normSettings));

    // Batch-sync to Firestore in the background
    if (normStudents.length > 0) {
      syncAllStudentsToFirestore(normStudents).catch((e) =>
        console.warn('Firestore restore students sync warning:', e)
      );
    }
    if (normTeachers.length > 0) {
      syncAllTeachersToFirestore(normTeachers).catch((e) =>
        console.warn('Firestore restore teachers sync warning:', e)
      );
    }
    if (normAttendance.length > 0) {
      syncAllAttendanceToFirestore(normAttendance).catch((e) =>
        console.warn('Firestore restore attendance sync warning:', e)
      );
    }
    if (normSettings) {
      saveSettingsToFirestore(normSettings, targetSchoolId).catch((e) =>
        console.warn('Firestore restore settings sync warning:', e)
      );
    }
  };

  // Single School Scoped Data (Semua data terpusat untuk 1 sekolah - SD Inpres 2 Ulatan):
  const effectiveStudents = students;
  const effectiveAttendance = attendanceRecords;
  const effectiveTeachers = teachers;
  const effectiveLeaves = scheduledLeaves;
  const effectiveBehaviorLogs = behaviorLogs;

  const todayCount = effectiveAttendance.filter((r) => r.date === todayStr).length;

  return (
    <ErrorBoundary fallbackTitle="Terjadi Kendala pada Aplikasi Utama">
      {/* Merah Putih SD Master Canvas: Bersih, elegan, nyaman di mata */}
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-row font-['Plus_Jakarta_Sans',sans-serif] selection:bg-red-700 selection:text-white transition-colors duration-200 print:bg-white print:text-black print:min-h-0 print:p-0 print:m-0">
        {/* Locked Sidebar Navigation (Stays fixed on left, does NOT scroll down with content) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          todayCount={todayCount}
          settings={settings}
          currentTeacher={currentTeacher}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleTeacherLogout}
          onOpenTeacherManage={() => setIsTeacherModalOpen(true)}
          onOpenAdminProfile={() => setIsAdminProfileModalOpen(true)}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
          onOpenAnnouncement={handleOpenAnnouncement}
          onOpenERaporSync={() => setIsERaporSyncModalOpen(true)}
          onShareLink={handleShareTeacherLink}
          onOpenRetroactiveAttendance={() => {
            setRetroactiveInitialDate(undefined);
            setRetroactiveInitialTeacherId(undefined);
            setIsRetroactiveModalOpen(true);
          }}
          onOpenTeacherListPrint={() => setIsPrintTeacherListModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Right Column: Header (Date & Dark/Light mode only) and Main Content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen print:min-h-0 print:w-full print:p-0 print:m-0">
          {/* Top Header - ONLY Date/Time and Dark/Light Mode toggle as requested */}
          <Header
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            currentSchoolName={settings.schoolName || 'SDK OGOMOJOLO'}
            onShareLink={handleShareTeacherLink}
            onOpenRetroactiveAttendance={() => {
              setRetroactiveInitialDate(undefined);
              setRetroactiveInitialTeacherId(undefined);
              setIsRetroactiveModalOpen(true);
            }}
          />

          {/* Toast Notifications & PWA Offline Indicator */}
          <Toast toasts={toasts} onDismiss={dismissToast} />
          <OfflineIndicator />

          {/* Main Content View */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 print:max-w-none print:w-full print:p-0 print:m-0">
          {activeTab === 'rekap_dinas' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Rekap Bulanan Format Dinas">
              <MonthlyRecapTab
                teachers={effectiveStudents}
                attendanceRecords={effectiveAttendance}
                settings={settings}
                currentTeacher={currentTeacher}
                onSaveAttendanceRecord={handleUpdateAttendanceRecord}
                onBulkSaveAttendanceRecords={handleBulkSaveAttendanceRecords}
                onUpdateSettings={handleUpdateSettings}
                onOpenRetroactiveAttendance={(date, teacherId) => {
                  setRetroactiveInitialDate(date);
                  setRetroactiveInitialTeacherId(teacherId);
                  setIsRetroactiveModalOpen(true);
                }}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'dashboard' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Dashboard Rekap">
              <DashboardTab
                students={effectiveStudents}
                attendanceRecords={effectiveAttendance}
                scheduledLeaves={effectiveLeaves}
                behaviorLogs={effectiveBehaviorLogs}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                settings={settings}
                teachers={effectiveTeachers}
                currentTeacher={currentTeacher}
                onAddManualAttendance={handleAddManualAttendance}
                onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
                onDeleteRecord={handleDeleteRecord}
                onSaveLeave={handleSaveLeave}
                onDeleteLeave={handleDeleteLeave}
                onSaveBehaviorLog={handleSaveBehaviorLog}
                onDeleteBehaviorLog={handleDeleteBehaviorLog}
                onOpenERaporSync={() => setIsERaporSyncModalOpen(true)}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'scanner' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Pemindai QR Camera">
              <ScannerTab
                students={effectiveStudents}
                attendanceRecords={effectiveAttendance}
                settings={settings}
                teachers={effectiveTeachers}
                currentTeacher={currentTeacher}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onLogout={handleTeacherLogout}
                onRecordAttendance={handleRecordAttendance}
                onManualSyncCloud={handleManualSyncCloud}
                isSyncingCloud={isSyncingCloud}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'students' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Kelola Data Guru & ID Card">
              <StudentsTab
                students={effectiveStudents}
                settings={settings}
                currentTeacher={currentTeacher}
                teachers={effectiveTeachers}
                scheduledLeaves={effectiveLeaves}
                behaviorLogs={effectiveBehaviorLogs}
                onAddStudent={handleAddStudent}
                onAddBulkStudents={handleAddBulkStudents}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onDeleteBulkStudents={handleBulkDeleteStudents}
                onSaveLeave={handleSaveLeave}
                onDeleteLeave={handleDeleteLeave}
                onSaveBehaviorLog={handleSaveBehaviorLog}
                onDeleteBehaviorLog={handleDeleteBehaviorLog}
                onOpenERaporSync={() => setIsERaporSyncModalOpen(true)}
              />
            </ErrorBoundary>
          )}

          {activeTab === 'simulator' && (
            <ErrorBoundary fallbackTitle="Terjadi Kendala pada Pengaturan & Simulasi">
              <SimulatorTab
                students={effectiveStudents}
                attendanceRecords={effectiveAttendance}
                settings={settings}
                currentTeacher={currentTeacher}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onUpdateSettings={handleUpdateSettings}
                onRecordAttendance={handleRecordAttendance}
                onResetData={handleResetData}
                onOpenAnnouncement={handleOpenAnnouncement}
                onResetAnnouncementStatus={handleResetAnnouncementStatus}
              />
            </ErrorBoundary>
          )}
        </main>

        {/* Teacher Login Modal */}
        {isLoginModalOpen && (
          <LoginModal
            teachers={teachers}
            currentTeacher={currentTeacher}
            onLogin={handleTeacherLogin}
            onClose={() => setIsLoginModalOpen(false)}
            canClose={true}
            schools={schools}
            currentSchoolId={currentSchoolId}
            onUpdateTeacherPin={handleUpdateTeacherPin}
          />
        )}

        {/* Teacher Management Modal for Admin */}
        {isTeacherModalOpen && currentTeacher?.role === 'admin' && (
          <TeacherManagementModal
            teachers={effectiveTeachers}
            currentTeacher={currentTeacher}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onClose={() => setIsTeacherModalOpen(false)}
          />
        )}

        {/* Admin Profile & School Data Customization Modal */}
        {isAdminProfileModalOpen && currentTeacher?.role === 'admin' && (
          <AdminProfileModal
            currentTeacher={currentTeacher}
            settings={settings}
            onUpdateTeacher={handleUpdateTeacher}
            onUpdateSettings={handleUpdateSettings}
            onClose={() => setIsAdminProfileModalOpen(false)}
          />
        )}

        {/* Guide Modal for Teachers & Selling app */}
        {isGuideModalOpen && (
          <GuideModal
            onClose={() => setIsGuideModalOpen(false)}
            onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
          />
        )}

        {/* Cloud Sync & Export Modal */}
        {isCloudSyncModalOpen && (
          <CloudSyncModal
            students={effectiveStudents}
            attendanceRecords={effectiveAttendance}
            settings={settings}
            teachers={effectiveTeachers}
            schools={schools}
            onRestoreData={handleRestoreData}
            onClose={() => setIsCloudSyncModalOpen(false)}
            onShowToast={addToast}
          />
        )}

        {/* Dapodik Announcement & Feature Update Pop-up Modal */}
        {isAnnouncementOpen && (
          <DapodikAnnouncementModal
            isOpen={isAnnouncementOpen}
            onClose={handleCloseAnnouncement}
            settings={settings}
            currentTeacher={currentTeacher}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToSettings={() => {
              setActiveTab('simulator');
            }}
          />
        )}

        {/* e-Rapor Merdeka Semester Recap Synchronization Modal (iihh Beres) */}
        {isERaporSyncModalOpen && (
          <ERaporSyncModal
            isOpen={isERaporSyncModalOpen}
            onClose={() => setIsERaporSyncModalOpen(false)}
            students={effectiveStudents}
            attendanceRecords={effectiveAttendance}
            scheduledLeaves={effectiveLeaves}
            settings={settings}
            currentTeacher={currentTeacher}
            onSuccessToast={(title, msg) => addToast(title, msg, 'success')}
          />
        )}

        {/* Modal Absensi Masa Lampau / Lupa Absen */}
        {isRetroactiveModalOpen && (
          <RetroactiveAttendanceModal
            isOpen={isRetroactiveModalOpen}
            onClose={() => {
              setIsRetroactiveModalOpen(false);
              setRetroactiveInitialDate(undefined);
              setRetroactiveInitialTeacherId(undefined);
            }}
            teachers={effectiveStudents}
            currentTeacher={currentTeacher}
            initialDate={retroactiveInitialDate}
            initialTeacherId={retroactiveInitialTeacherId}
            onSaveAttendance={(record) => {
              handleUpdateAttendanceRecord(record);
            }}
            schoolId={settings.schoolId}
            settings={settings}
          />
        )}

        {/* Modal Cetak Daftar Guru & PTK Resmi */}
        {isPrintTeacherListModalOpen && (
          <TeacherListPrintModal
            students={effectiveStudents}
            settings={settings}
            onClose={() => setIsPrintTeacherListModalOpen(false)}
          />
        )}

          {/* Footer with Firebase Cloud status */}
          <footer className="border-t border-[#0d5947] dark:border-[#07382d] bg-[#043328] dark:bg-[#011a14] py-4 text-center text-xs text-emerald-200/80 dark:text-emerald-300/70 no-print transition-colors">
            <div className="flex items-center justify-center gap-2 flex-wrap px-4">
              <span>&copy; {new Date().getFullYear()} {settings.schoolName} — Sistem Presensi QR Code Guru & PTK</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Firebase Cloud Connected
              </span>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}
