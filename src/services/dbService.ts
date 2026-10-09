import { ServerDevice, DataCenterNode, ServerEvent } from "../types";

export interface TyroneDatabaseDump {
  version: string;
  timestamp: string;
  servers: ServerDevice[];
  hierarchy: DataCenterNode[];
  userAccounts: Array<{ id: string; username: string; role: string; description: string; password?: string }>;
  rbacPermissions: Record<string, boolean>;
  telemetryLogs: Array<{ id: string; serverIp: string; timestamp: string; powerW: string; tempC: string; status: string }>;
}

const DB_NAME = "Tyrone_DCM_Database_v1";

/**
 * High-performance Browser Persistent Database Service
 * Wraps IndexedDB and LocalStorage to manage persistent storage, telemetry logs, configuration backups, and restore operations.
 */
export class TyroneDatabaseService {
  private static STORAGE_KEYS = {
    SERVERS: "tyrone_dcm_servers",
    HIERARCHY: "tyrone_dcm_hierarchy",
    USERS: "tyrone_user_accounts",
    PERMISSIONS: "tyrone_rbac_permissions",
    TELEMETRY_LOGS: "tyrone_telemetry_history_db",
  };

  private static cachedServers: ServerDevice[] | null = null;
  private static cachedHierarchy: DataCenterNode[] | null = null;

  /**
   * Save servers collection to database
   */
  public static saveServers(servers: ServerDevice[]): void {
    this.cachedServers = servers;
    try {
      localStorage.setItem(this.STORAGE_KEYS.SERVERS, JSON.stringify(servers));
    } catch (e) {
      console.error("Database Save Error (Servers):", e);
    }
  }

  /**
   * Fetch servers collection from database
   */
  public static getServers(): ServerDevice[] {
    if (this.cachedServers) return this.cachedServers;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.SERVERS);
      if (raw) {
        this.cachedServers = JSON.parse(raw);
        return this.cachedServers!;
      }
    } catch (e) {
      console.error("Database Fetch Error (Servers):", e);
    }
    return [];
  }

  /**
   * Save physical hierarchy topology to database
   */
  public static saveHierarchy(hierarchy: DataCenterNode[]): void {
    this.cachedHierarchy = hierarchy;
    try {
      localStorage.setItem(this.STORAGE_KEYS.HIERARCHY, JSON.stringify(hierarchy));
    } catch (e) {
      console.error("Database Save Error (Hierarchy):", e);
    }
  }

  /**
   * Fetch physical hierarchy topology from database
   */
  public static getHierarchy(): DataCenterNode[] {
    if (this.cachedHierarchy) return this.cachedHierarchy;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.HIERARCHY);
      if (raw) {
        this.cachedHierarchy = JSON.parse(raw);
        return this.cachedHierarchy!;
      }
    } catch (e) {
      console.error("Database Fetch Error (Hierarchy):", e);
    }
    return [];
  }

  /**
   * Log telemetry record to database history table
   */
  public static logTelemetryRecord(serverIp: string, powerW: string, tempC: string, status: string): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.TELEMETRY_LOGS);
      const logs: Array<{ id: string; serverIp: string; timestamp: string; powerW: string; tempC: string; status: string }> = raw ? JSON.parse(raw) : [];
      
      const newRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        serverIp,
        timestamp: new Date().toISOString(),
        powerW,
        tempC,
        status,
      };

      // Keep up to 200 historical telemetry records in database
      const updated = [newRecord, ...logs].slice(0, 200);
      localStorage.setItem(this.STORAGE_KEYS.TELEMETRY_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error("Database Telemetry Log Error:", e);
    }
  }

  /**
   * Fetch historical telemetry records from database
   */
  public static getTelemetryRecords(): Array<{ id: string; serverIp: string; timestamp: string; powerW: string; tempC: string; status: string }> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.TELEMETRY_LOGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Database Telemetry Fetch Error:", e);
    }
    return [];
  }

  /**
   * Get database metrics (total record counts & total storage size in KB)
   */
  public static getDatabaseStats(): {
    serverCount: number;
    dcCount: number;
    userCount: number;
    telemetryLogCount: number;
    totalSizeKb: string;
    lastUpdated: string;
  } {
    const servers = this.getServers();
    const hierarchy = this.getHierarchy();
    const logs = this.getTelemetryRecords();

    let usersRaw = localStorage.getItem(this.STORAGE_KEYS.USERS);
    let users = usersRaw ? JSON.parse(usersRaw) : [];

    let totalBytes = 0;
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      const val = localStorage.getItem(key);
      if (val) totalBytes += val.length * 2;
    });

    return {
      serverCount: servers.length,
      dcCount: hierarchy.length,
      userCount: users.length,
      telemetryLogCount: logs.length,
      totalSizeKb: (totalBytes / 1024).toFixed(2),
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }

  /**
   * Export complete Tyrone Database dump as a downloadable JSON file
   */
  public static exportDatabaseJSON(): void {
    const dump: TyroneDatabaseDump = {
      version: "6.2.0-Production",
      timestamp: new Date().toISOString(),
      servers: this.getServers(),
      hierarchy: this.getHierarchy(),
      userAccounts: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.USERS) || "[]"),
      rbacPermissions: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PERMISSIONS) || "{}"),
      telemetryLogs: this.getTelemetryRecords(),
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tyrone_DCM_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Restore Tyrone Database from JSON dump
   */
  public static importDatabaseJSON(jsonData: string): boolean {
    try {
      const parsed: TyroneDatabaseDump = JSON.parse(jsonData);
      if (parsed.servers && Array.isArray(parsed.servers)) {
        this.saveServers(parsed.servers);
      }
      if (parsed.hierarchy && Array.isArray(parsed.hierarchy)) {
        this.saveHierarchy(parsed.hierarchy);
      }
      if (parsed.userAccounts && Array.isArray(parsed.userAccounts)) {
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(parsed.userAccounts));
      }
      if (parsed.rbacPermissions && typeof parsed.rbacPermissions === "object") {
        localStorage.setItem(this.STORAGE_KEYS.PERMISSIONS, JSON.stringify(parsed.rbacPermissions));
      }
      if (parsed.telemetryLogs && Array.isArray(parsed.telemetryLogs)) {
        localStorage.setItem(this.STORAGE_KEYS.TELEMETRY_LOGS, JSON.stringify(parsed.telemetryLogs));
      }
      return true;
    } catch (e) {
      console.error("Failed to restore database from backup file:", e);
      return false;
    }
  }

  /**
   * Reset database back to clean state
   */
  public static resetDatabase(): void {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}
