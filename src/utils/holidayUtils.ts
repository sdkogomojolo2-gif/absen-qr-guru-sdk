/**
 * Holiday and Calendar utilities for Indonesian School Attendance
 * Tracks Sundays (Hari Minggu), Indonesian National Holidays (Tanggal Merah),
 * and School Custom Holidays (Libur Semester, Cuti Bersama, dll.)
 */

export interface DayInfo {
  dayNumber: number; // 1..31
  dateStr: string; // YYYY-MM-DD
  dayName: string; // 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  isSunday: boolean;
  isHoliday: boolean;
  holidayName?: string;
}

// Indonesian National Holidays (Tanggal Merah Nasional)
export const KNOWN_NATIONAL_HOLIDAYS: { [dateStr: string]: string } = {
  // 2025
  '2025-01-01': 'Tahun Baru 2025 Masehi',
  '2025-01-27': 'Isra Mi\'raj Nabi Muhammad SAW',
  '2025-01-29': 'Tahun Baru Imlek 2576 Kongzili',
  '2025-03-29': 'Hari Suci Nyepi Tahun Baru Saka 1947',
  '2025-03-31': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-01': 'Hari Raya Idul Fitri 1446 H',
  '2025-04-18': 'Wafat Yesus Kristus',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak 2569 BE',
  '2025-05-29': 'Kenaikan Yesus Kristus',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-07': 'Hari Raya Idul Adha 1446 H',
  '2025-06-27': 'Tahun Baru Islam 1447 H',
  '2025-08-17': 'Hari Kemerdekaan RI Ke-80',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-11-25': 'Hari Guru Nasional',
  '2025-12-25': 'Hari Raya Natal',

  // 2026
  '2026-01-01': 'Tahun Baru 2026 Masehi',
  '2026-01-16': 'Isra Mi\'raj Nabi Muhammad SAW',
  '2026-02-17': 'Tahun Baru Imlek 2577 Kongzili',
  '2026-03-19': 'Hari Suci Nyepi Tahun Baru Saka 1948',
  '2026-03-20': 'Hari Raya Idul Fitri 1447 H',
  '2026-03-21': 'Hari Raya Idul Fitri 1447 H',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-31': 'Hari Raya Waisak 2570 BE',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-05-27': 'Hari Raya Idul Adha 1447 H',
  '2026-06-16': 'Tahun Baru Islam 1448 H',
  '2026-08-17': 'Hari Kemerdekaan RI Ke-81',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-11-25': 'Hari Guru Nasional',
  '2026-12-25': 'Hari Raya Natal',
};

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Returns month calendar info for all days in YYYY-MM
 */
export function getMonthDaysInfo(
  yearMonth: string, // 'YYYY-MM'
  customHolidays?: { [dateStr: string]: string }
): DayInfo[] {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1..12

  // Total days in this month
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: DayInfo[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayPad = String(day).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayPad}`;
    // Construct local Date at noon to avoid timezone shift
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday
    const isSunday = dayOfWeek === 0;

    // Check custom holiday first, then known national holidays
    let holidayName = customHolidays?.[dateStr] || KNOWN_NATIONAL_HOLIDAYS[dateStr];
    const isHoliday = Boolean(holidayName);

    result.push({
      dayNumber: day,
      dateStr,
      dayName: DAY_NAMES_ID[dayOfWeek],
      isSunday,
      isHoliday,
      holidayName: isSunday ? 'Hari Minggu' : holidayName,
    });
  }

  return result;
}

/**
 * Checks if a specific date string (YYYY-MM-DD) is a Sunday
 */
export function isDateSunday(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day, 12, 0, 0);
  return d.getDay() === 0;
}

/**
 * Gets holiday description if date is a holiday or Sunday
 */
export function getHolidayDescription(
  dateStr: string,
  customHolidays?: { [dateStr: string]: string }
): string | null {
  if (isDateSunday(dateStr)) return 'Hari Minggu';
  if (customHolidays && customHolidays[dateStr]) return customHolidays[dateStr];
  if (KNOWN_NATIONAL_HOLIDAYS[dateStr]) return KNOWN_NATIONAL_HOLIDAYS[dateStr];
  return null;
}
