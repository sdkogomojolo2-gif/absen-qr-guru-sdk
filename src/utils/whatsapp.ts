import { Guru, AttendanceRecord, ScheduledLeave, BehaviorLog, SystemSettings } from '../types';
import { resolveAttendanceEntryTime, resolveAttendanceReturnTime } from './scheduleUtils';

/**
 * Formats Indonesian phone number into WhatsApp international format (628xxx)
 */
export const formatPhoneNumberForWA = (phone?: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, ''); // Keep only digits

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Generates official WhatsApp attendance confirmation for Teacher / PTK
 */
export const generateWAAttendanceMessage = (
  guru: Guru,
  record: AttendanceRecord,
  schoolName: string,
  settings?: SystemSettings
): string => {
  const statusEmoji =
    record.status === 'Hadir'
      ? '✅'
      : record.status === 'Terlambat'
      ? '⏰'
      : record.status === 'Dinas Luar'
      ? '🏛️'
      : record.status === 'Izin' || record.status === 'Sakit'
      ? 'ℹ️'
      : '⚠️';

  const displayTimeIn = resolveAttendanceEntryTime(record, settings) || record.timeIn || record.time;
  const displayTimeOut = resolveAttendanceReturnTime(record, settings) || record.timeOut;

  return `Yth. Bapak/Ibu *${guru.name}*
Jabatan: *${guru.position || guru.classRoom || 'Guru / Tenaga Pendidik'}*

Bukti Tanda Terima Presensi Harian Guru & PTK *${schoolName}*:

${statusEmoji} *Status Kehadiran*: ${record.status.toUpperCase()}
📅 *Tanggal*: ${record.date}
⏰ *Jam Masuk*: ${displayTimeIn} WITA/WIB
${displayTimeOut ? `🚪 *Jam Pulang*: ${displayTimeOut} WITA/WIB\n` : ''}📌 *NIP/NUPTK*: ${guru.nip || guru.nis || '-'}
📝 *Keterangan*: ${record.note || 'Tercatat otomatis melalui QR Code'}

Semangat mengabdi dan mendidik generasi penerus bangsa!
_Sistem Presensi Digital PTK ${schoolName}_`;
};

/**
 * Generates friendly WhatsApp Reminder for teachers who haven't checked in
 */
export const generateWAAbsenteeConfirmationMessage = (
  guru: Guru,
  date: string,
  cutoffTime: string,
  schoolName: string
): string => {
  return `Salam hangat, Bapak/Ibu *${guru.name}* (${guru.position || 'Guru / PTK'}),

Berdasarkan data Sistem Presensi Digital *${schoolName}*, hingga pukul *${cutoffTime} WITA/WIB* hari ini (*${date}*), Bapak/Ibu *belum terdata melakukan presensi masuk*.

Mohon konfirmasi mengenai kehadiran Bapak/Ibu:
1️⃣ Apakah sedang dalam perjalanan ke sekolah?
2️⃣ Apakah sedang melaksanakan *Dinas Luar / Tugas Pelatihan*?
3️⃣ Atau berhalangan hadir (Sakit / Izin)?

Jika sedang berhalangan atau tugas dinas luar, mohon hubungi operator/admin sekolah agar status presensi dapat diperbarui.

Terima kasih atas dedikasi dan kerja samanya.
_Operator Presensi & Manajemen ${schoolName}_`;
};

/**
 * Opens WhatsApp Absentee / Reminder Follow-Up
 */
export const openWAAbsenteeNotification = (
  guru: Guru,
  date: string,
  cutoffTime: string,
  schoolName: string
): boolean => {
  const phone = guru.phone || guru.parentPhone;
  const formattedPhone = formatPhoneNumberForWA(phone);
  if (!formattedPhone) {
    alert(`Nomor WhatsApp untuk ${guru.name} belum terdaftar.`);
    return false;
  }

  const message = generateWAAbsenteeConfirmationMessage(guru, date, cutoffTime, schoolName);
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

/**
 * Generates Scheduled Leave / Official Duty (SPT / Dinas Luar) message
 */
export const generateWALeaveMessage = (
  guru: Guru,
  leave: ScheduledLeave,
  schoolName: string
): string => {
  return `Yth. Bapak/Ibu *${guru.name}* (${guru.position || 'Guru / PTK'}),

Permohonan ${leave.type} telah *tercatat resmi* pada Sistem Kepegawaian *${schoolName}*:

📋 *Jenis*: ${leave.type.toUpperCase()}
📅 *Periode*: ${leave.startDate} s/d ${leave.endDate}
📝 *Keterangan / Alasan*: ${leave.reason || '-'}
📄 *Lampiran Dokumen/Surat*: ${leave.attachmentPhoto ? 'Terlampir di Sistem' : 'Tervalidasi'}
⭐ *Status*: ${leave.status || 'Disetujui'}

Terima kasih atas kerja samanya.
_Tata Usaha & Manajemen ${schoolName}_`;
};

/**
 * Generates Behavior Log / Achievement Points notification
 */
export const generateWABehaviorMessage = (
  guru: Guru,
  log: BehaviorLog,
  totalBalance: number,
  schoolName: string
): string => {
  const isPositive = log.type === 'positive';
  const icon = isPositive ? '🌟' : '⚠️';
  const pointPrefix = log.points > 0 ? `+${log.points}` : `${log.points}`;

  return `Yth. Bapak/Ibu *${guru.name}* (${guru.position || 'Guru / PTK'}),

Catatan Jurnal Kinerja & Apresiasi PTK dari *${schoolName}*:

${icon} *Kategori*: ${log.category}
📌 *Catatan*: *${log.title}* (${pointPrefix} Poin)
📝 *Keterangan*: ${log.description || '-'}
👨‍🏫 *Pencatat*: ${log.recordedBy || 'Admin Sekolah'}
📅 *Tanggal*: ${log.date}
⭐ *Total Poin Karakter/Prestasi*: ${totalBalance} Poin

Terima kasih atas dedikasi dan kinerjanya.
_Tim Manajemen PTK ${schoolName}_`;
};

/**
 * Opens WhatsApp Web/App directly with the pre-filled text
 */
export const openWhatsAppNotification = (
  guru: Guru,
  record: AttendanceRecord,
  schoolName: string
): boolean => {
  const phone = guru.phone || guru.parentPhone;
  const formattedPhone = formatPhoneNumberForWA(phone);
  if (!formattedPhone) {
    alert(`Nomor WhatsApp untuk ${guru.name} belum diisi.`);
    return false;
  }

  const message = generateWAAttendanceMessage(guru, record, schoolName);
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

/**
 * Copies WhatsApp message to user's clipboard
 */
export const copyWAMessageToClipboard = async (
  messageOrGuru: string | Guru,
  record?: AttendanceRecord,
  schoolName?: string
): Promise<boolean> => {
  try {
    let messageText = '';
    if (typeof messageOrGuru === 'string') {
      messageText = messageOrGuru;
    } else if (record && schoolName) {
      messageText = generateWAAttendanceMessage(messageOrGuru, record, schoolName);
    }
    await navigator.clipboard.writeText(messageText);
    return true;
  } catch (err) {
    console.error('Failed to copy WA message:', err);
    return false;
  }
};

/**
 * Menghasilkan Teks Laporan Rekap Presensi Harian Guru untuk WhatsApp
 */
export const generateWADailySummaryMessage = (
  date: string,
  teachers: Guru[],
  records: AttendanceRecord[],
  leaves: ScheduledLeave[] = [],
  settings?: any
): string => {
  const schoolName = settings?.schoolName || 'SDN Kecil Ogomojolo';

  let formattedDate = date;
  try {
    const [y, m, d] = date.split('-').map(Number);
    formattedDate = new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    formattedDate = date;
  }

  // Filter records for today
  const dailyRecords = records.filter((r) => r.date === date);
  const recordMap = new Map<string, AttendanceRecord>();
  dailyRecords.forEach((r) => {
    const id = r.guruId || r.studentId || r.nip || r.nis;
    if (id) recordMap.set(id, r);
  });

  // Filter leaves active on this date
  const activeLeaves = leaves.filter(
    (l) => l.startDate <= date && date <= l.endDate
  );
  const leaveMap = new Map<string, ScheduledLeave>();
  activeLeaves.forEach((l) => {
    const id = l.teacherId || l.studentId;
    if (id) leaveMap.set(id, l);
  });

  const hadirList: { guru: Guru; record: AttendanceRecord }[] = [];
  const terlambatList: { guru: Guru; record: AttendanceRecord }[] = [];
  const dinasLuarList: { guru: Guru; note?: string }[] = [];
  const izinSakitList: { guru: Guru; type: string; reason?: string }[] = [];
  const belumAbsenList: Guru[] = [];

  teachers.forEach((t) => {
    const rec =
      recordMap.get(t.id) ||
      (t.nip && recordMap.get(t.nip)) ||
      (t.nis && recordMap.get(t.nis));
    const leave = leaveMap.get(t.id);

    if (rec) {
      if (rec.status === 'Hadir') {
        hadirList.push({ guru: t, record: rec });
      } else if (rec.status === 'Terlambat') {
        terlambatList.push({ guru: t, record: rec });
      } else if (rec.status === 'Dinas Luar') {
        dinasLuarList.push({ guru: t, note: rec.note });
      } else if (rec.status === 'Izin' || rec.status === 'Sakit') {
        izinSakitList.push({ guru: t, type: rec.status, reason: rec.note });
      }
    } else if (leave) {
      if (leave.type === 'Dinas Luar') {
        dinasLuarList.push({ guru: t, note: leave.reason });
      } else {
        izinSakitList.push({ guru: t, type: leave.type, reason: leave.reason });
      }
    } else {
      belumAbsenList.push(t);
    }
  });

  const totalTeachers = teachers.length;
  const totalHadir = hadirList.length + terlambatList.length + dinasLuarList.length;
  const attendanceRate =
    totalTeachers > 0 ? Math.round((totalHadir / totalTeachers) * 100) : 0;
  const printTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let text = `📢 *REKAP PRESENSI HARIAN GURU & PTK*
🏛️ *${schoolName}*
📅 *${formattedDate}*
⏰ Waktu Laporan: *${printTime} WITA*

━━━━━━━━━━━━━━━━━━━━
📊 *RINGKASAN KEHADIRAN:*
👥 Total Guru & PTK : *${totalTeachers} Orang*
✅ Hadir Tepat Waktu : *${hadirList.length} Orang*
⏰ Terlambat : *${terlambatList.length} Orang*
🏛️ Dinas Luar : *${dinasLuarList.length} Orang*
📋 Izin / Sakit : *${izinSakitList.length} Orang*
❌ Belum Presensi : *${belumAbsenList.length} Orang*
📈 Tingkat Kehadiran : *${attendanceRate}%*
━━━━━━━━━━━━━━━━━━━━`;

  if (hadirList.length > 0) {
    text += `\n\n✅ *HADIR TEPAT WAKTU (${hadirList.length}):*`;
    hadirList.forEach((item, idx) => {
      const timeIn = resolveAttendanceEntryTime(item.record, settings);
      const returnTime = resolveAttendanceReturnTime(item.record, settings);
      const timeOut = returnTime ? ` | Pulang: ${returnTime}` : '';
      text += `\n${idx + 1}. *${item.guru.name}* (${timeIn} WITA${timeOut})`;
    });
  }

  if (terlambatList.length > 0) {
    text += `\n\n⏰ *TERLAMBAT (${terlambatList.length}):*`;
    terlambatList.forEach((item, idx) => {
      const timeIn = resolveAttendanceEntryTime(item.record, settings);
      text += `\n${idx + 1}. *${item.guru.name}* (${timeIn} WITA) - _${item.record.note || 'Terlambat'}_`;
    });
  }

  if (dinasLuarList.length > 0) {
    text += `\n\n🏛️ *DINAS LUAR (${dinasLuarList.length}):*`;
    dinasLuarList.forEach((item, idx) => {
      text += `\n${idx + 1}. *${item.guru.name}* (${item.note || 'Tugas Dinas Luar'})`;
    });
  }

  if (izinSakitList.length > 0) {
    text += `\n\n📋 *IZIN / SAKIT (${izinSakitList.length}):*`;
    izinSakitList.forEach((item, idx) => {
      text += `\n${idx + 1}. *${item.guru.name}* - *${item.type}* (${item.reason || '-'})`;
    });
  }

  if (belumAbsenList.length > 0) {
    text += `\n\n⚠️ *BELUM MELAKUKAN PRESENSI (${belumAbsenList.length}):*`;
    belumAbsenList.forEach((g, idx) => {
      text += `\n${idx + 1}. *${g.name}* (${g.position || g.subject || 'Guru'})`;
    });
  }

  text += `\n\n_Laporan otomatis Sistem Presensi Digital PTK ${schoolName}_`;
  return text;
};

/**
 * Membuka WhatsApp untuk mengirim rekap harian ke nomor tujuan atau share umum
 */
export const openWADailySummary = (
  date: string,
  teachers: Guru[],
  records: AttendanceRecord[],
  leaves: ScheduledLeave[] = [],
  settings?: any,
  targetPhoneOverride?: string
): boolean => {
  const message = generateWADailySummaryMessage(
    date,
    teachers,
    records,
    leaves,
    settings
  );
  const encoded = encodeURIComponent(message);

  const phone = targetPhoneOverride || settings?.whatsappTargetPhone;
  const formattedPhone = phone ? formatPhoneNumberForWA(phone) : '';

  let url = '';
  if (formattedPhone) {
    url = `https://wa.me/${formattedPhone}?text=${encoded}`;
  } else {
    // Buka dialog share WhatsApp umum
    url = `https://api.whatsapp.com/send?text=${encoded}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

