import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export interface SQLiteSyncPayload {
  teachers?: any[];
  students?: any[]; // Data guru
  attendanceRecords?: any[];
  settings?: any;
  scheduledLeaves?: any[];
  syncedAt?: string;
}

export function saveDatabaseDb(payload: SQLiteSyncPayload): {
  success: boolean;
  filePath: string;
  fileSize: number;
  message: string;
  syncedAt: string;
  counts: {
    guru: number;
    absensi: number;
    pengaturan: number;
    izin: number;
  };
} {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  const nowStr = payload.syncedAt || new Date().toISOString();

  // If previous file exists, ensure fresh write or overwrite
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // Continue even if unlink fails
    }
  }

  const db = new DatabaseSync(dbPath);

  try {
    // 1. Create Tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS guru (
        id TEXT PRIMARY KEY,
        nip TEXT,
        nama TEXT NOT NULL,
        jabatan TEXT,
        status_kepegawaian TEXT,
        pangkat_golongan TEXT,
        jenis_kelamin TEXT,
        no_wa TEXT,
        email TEXT,
        foto TEXT
      );

      CREATE TABLE IF NOT EXISTS absensi (
        id TEXT PRIMARY KEY,
        tanggal TEXT NOT NULL,
        guru_id TEXT,
        nip TEXT,
        nama_guru TEXT,
        jabatan TEXT,
        status_kepegawaian TEXT,
        jam_masuk TEXT,
        jam_pulang TEXT,
        status TEXT NOT NULL,
        keterangan TEXT,
        metode_absen TEXT
      );

      CREATE TABLE IF NOT EXISTS pengaturan (
        kunci TEXT PRIMARY KEY,
        nilai TEXT
      );

      CREATE TABLE IF NOT EXISTS izin_cuti (
        id TEXT PRIMARY KEY,
        guru_id TEXT,
        nama_guru TEXT,
        tanggal_mulai TEXT,
        tanggal_selesai TEXT,
        jenis TEXT,
        alasan TEXT
      );

      CREATE TABLE IF NOT EXISTS riwayat_sinkron (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        waktu_sinkron TEXT,
        total_guru INTEGER,
        total_absensi INTEGER,
        status_cloud TEXT
      );
    `);

    // 2. Insert Guru (from students or teachers list)
    const guruList = (payload.students && payload.students.length > 0) ? payload.students : (payload.teachers || []);
    const insertGuru = db.prepare(`
      INSERT INTO guru (id, nip, nama, jabatan, status_kepegawaian, pangkat_golongan, jenis_kelamin, no_wa, email, foto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const g of guruList) {
      const nip = g.nip || g.nis || g.nuptk || '';
      const nama = g.name || g.nama || '';
      const jabatan = g.position || g.classRoom || g.subject || 'Guru';
      const status = g.employmentStatus || 'PNS';
      const pangkat = g.rankGrade || '';
      const jk = g.gender || 'Laki-laki';
      const noWa = g.phone || g.parentPhone || '';
      const email = g.email || '';
      const foto = g.photo || g.avatarUrl || '';

      insertGuru.run(g.id || `guru-${Math.random()}`, nip, nama, jabatan, status, pangkat, jk, noWa, email, foto);
    }

    // 3. Insert Absensi
    const absensiList = payload.attendanceRecords || [];
    const insertAbsen = db.prepare(`
      INSERT INTO absensi (id, tanggal, guru_id, nip, nama_guru, jabatan, status_kepegawaian, jam_masuk, jam_pulang, status, keterangan, metode_absen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const a of absensiList) {
      const guruId = a.guruId || a.studentId || '';
      const nip = a.nip || a.nis || '';
      const nama = a.guruName || a.studentName || '';
      const jabatan = a.position || a.classRoom || '';
      const statusPeg = a.employmentStatus || '';
      const jamMasuk = a.timeIn || a.time || '';
      const jamPulang = a.timeOut || '';
      const status = a.status || 'Hadir';
      const ket = a.note || a.activityLog || '';
      const metode = a.scannedVia || 'QR Camera';

      insertAbsen.run(a.id || `absen-${Math.random()}`, a.date, guruId, nip, nama, jabatan, statusPeg, jamMasuk, jamPulang, status, ket, metode);
    }

    // 4. Insert Settings
    if (payload.settings && typeof payload.settings === 'object') {
      const insertSetting = db.prepare(`INSERT INTO pengaturan (kunci, nilai) VALUES (?, ?)`);
      for (const [key, val] of Object.entries(payload.settings)) {
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        insertSetting.run(key, strVal);
      }
    }

    // 5. Insert Scheduled Leaves
    const leaveList = payload.scheduledLeaves || [];
    if (leaveList.length > 0) {
      const insertLeave = db.prepare(`
        INSERT INTO izin_cuti (id, guru_id, nama_guru, tanggal_mulai, tanggal_selesai, jenis, alasan)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const l of leaveList) {
        insertLeave.run(
          l.id || `leave-${Math.random()}`,
          l.studentId || l.guruId || '',
          l.studentName || l.guruName || '',
          l.startDate || '',
          l.endDate || '',
          l.type || 'Izin',
          l.reason || ''
        );
      }
    }

    // 6. Record Sync Log
    const insertSync = db.prepare(`
      INSERT INTO riwayat_sinkron (waktu_sinkron, total_guru, total_absensi, status_cloud)
      VALUES (?, ?, ?, ?)
    `);
    insertSync.run(nowStr, guruList.length, absensiList.length, 'Cloud Firestore & SQLite DB Tersimpan');

  } finally {
    db.close();
  }

  const stat = fs.statSync(dbPath);

  return {
    success: true,
    filePath: 'database.db',
    fileSize: stat.size,
    message: `Database database.db (${(stat.size / 1024).toFixed(1)} KB) berhasil dibuat dan disimpan di folder aplikasi.`,
    syncedAt: nowStr,
    counts: {
      guru: (payload.students && payload.students.length > 0) ? payload.students.length : (payload.teachers?.length || 0),
      absensi: payload.attendanceRecords?.length || 0,
      pengaturan: payload.settings ? Object.keys(payload.settings).length : 0,
      izin: payload.scheduledLeaves?.length || 0,
    },
  };
}
