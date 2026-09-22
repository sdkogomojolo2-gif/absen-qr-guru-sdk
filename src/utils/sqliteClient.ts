/**
 * Client utility to trigger server SQLite database.db generation,
 * check status, and trigger automatic downloads.
 */

export interface SqliteSaveResult {
  success: boolean;
  message: string;
  filePath?: string;
  fileSize?: number;
  syncedAt?: string;
  counts?: {
    guru: number;
    absensi: number;
    pengaturan: number;
    izin: number;
  };
  base64Data?: string;
}

export interface SqliteStatusResult {
  exists: boolean;
  size: number;
  sizeKb: string;
  modifiedAt: string | null;
}

export async function saveSQLiteDatabaseOnServer(payload: {
  students?: any[];
  teachers?: any[];
  attendanceRecords?: any[];
  settings?: any;
  scheduledLeaves?: any[];
}): Promise<SqliteSaveResult> {
  try {
    const res = await fetch('/api/save-database-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Could not save database.db to server via API:', err);
    return {
      success: false,
      message: err.message || 'Gagal menyimpan database.db ke server',
    };
  }
}

export async function checkSQLiteDatabaseStatus(): Promise<SqliteStatusResult> {
  try {
    const res = await fetch('/api/database-db-status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch {
    return {
      exists: false,
      size: 0,
      sizeKb: '0',
      modifiedAt: null,
    };
  }
}

/**
 * Triggers direct browser download of the database.db file
 */
export function downloadDatabaseDbFile(base64Data?: string) {
  if (base64Data) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database.db';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } else {
    // Direct link to API
    const a = document.createElement('a');
    a.href = '/api/download-database-db';
    a.download = 'database.db';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  }
}
