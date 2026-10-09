export interface ServerDevice {
  id: string;
  name: string;
  ip: string;
  bmcIp: string;
  username: string;
  password?: string;
  protocol: "IPMI" | "Redfish" | "SNMP" | "SSH";
  weightKg: string;
  powerW: string;
  sizeU: string;
  chassisLed: "Off" | "On" | "Blinking";
  status: "Online" | "Warning" | "Critical" | "Fetching" | "Offline";
  serialNumber: string;
  model: string;
  vendor: string;
  mgmtModuleVersion: string;
  mgmtConsoleUrl: string;
  capabilities: string[];
  lastSeen?: string;
  rackId?: string;
  rackName?: string;
}

export interface RackNode {
  id: string;
  name: string;
  powerCapacityW: number;
  spaceCapacityU: number;
  weightCapacityKg: number;
  devices: ServerDevice[];
}

export interface RowNode {
  id: string;
  name: string;
  racks: RackNode[];
}

export interface RoomNode {
  id: string;
  name: string;
  rows: RowNode[];
}

export interface DataCenterNode {
  id: string;
  name: string;
  rooms: RoomNode[];
}

export interface TelemetrySummary {
  powerWatts: number;
  spaceU: number;
  weightKg: number;
  tempCelsius: number;
  gpuCount: number;
  cpuCount: number;
  memoryGiB: number;
  storageGB: number;
  hostNicsCount: number;
}

export interface ComponentBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface InventorySpecs {
  processor: {
    model: string;
    architecture: string;
    manufacturer: string;
    maxFrequencyMHz: number;
    socket: string;
    totalCores: number;
    totalThreads: number;
    count: number;
    serialNumber: string;
    family?: string;
  };
  memory: {
    totalCapacityGiB: number;
    dimmCount: number;
    dimms: Array<{
      slot: string;
      sizeGiB: number;
      speedMHz: number;
      manufacturer: string;
      partNumber: string;
      serialNumber: string;
      type: string;
    }>;
  };
  storage: {
    driveCount: number;
    totalCapacityGB: number;
    drives: Array<{
      id: string;
      model: string;
      capacityGB: number;
      mediaType: string;
      interface: string;
      serialNumber: string;
    }>;
  };
  hostNic: {
    count: number;
    nics: Array<{
      name: string;
      macAddress: string;
      speed: string;
      status: string;
      serialNumber: string;
    }>;
  };
  fan: {
    count: number;
    fans: Array<{
      name: string;
      currentRPM: number;
      minRPM: number;
      maxRPM: number;
      status: string;
      serialNumber: string;
    }>;
  };
  psu: {
    count: number;
    psus: Array<{
      id: string;
      model: string;
      capacityWatts: number;
      inputVoltage: string;
      serialNumber: string;
      status: string;
    }>;
  };
  aoc: {
    count: number;
    cards: Array<{
      slot: string;
      name: string;
      vendor: string;
      pcieWidth: string;
      serialNumber: string;
      status: string;
    }>;
  };
  sensorData: {
    count: number;
    sensors: Array<{
      id: string;
      name: string;
      category: string;
      value: string;
      status: string;
    }>;
  };
  peripheral?: {
    pcieCount: number;
    devices: Array<{
      slot: string;
      name: string;
      vendor: string;
    }>;
  };
}

export interface HealthStatusItem {
  category: "Power Supply" | "Voltage" | "Storage" | "Fan" | "Temperature" | "Memory" | "CPU";
  status: "Normal" | "Warning" | "Critical";
  details: string;
}

export interface FaultLog {
  id: string;
  component: string;
  description: string;
  timestamp: string;
  severity: "OK" | "Warning" | "Critical";
}

export interface SensorReading {
  id: string;
  sensorName: string;
  value: string;
  status: "ok" | "warning" | "critical";
}

export interface ServerEvent {
  id: string;
  severity: "Critical" | "Error" | "Warning" | "Informative";
  address: string;
  category: string;
  type: string;
  description: string;
  timestamp: string;
  count: number;
  acknowledged: boolean;
}
