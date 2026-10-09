<div align="center">
<img width="500" alt="Tyrone Systems Logo" src="https://tyronesystems.com/tyrone-new/img/tyrone-logo.png" />
</div>

<div align="center">

# Tyrone Data Center Manager (DCM) Console — GREEN DASH
**Enterprise-Grade Data Center Infrastructure & Redfish BMC Telemetry Dashboard**

[![Version](https://img.shields.io/badge/version-6.2.0--Enterprise-2E3A23.svg)](https://tyronesystems.com)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## 📖 Overview

**GREEN DASH** (Tyrone Data Center Manager Console) is a unified, high-performance web console for managing enterprise server infrastructure, data center racks, and Redfish BMC telemetry. Built with React 19, TypeScript, Vite, and Tailwind CSS, it offers real-time monitoring, hardware diagnostics, inventory tracking, GPU metrics, and rack topology visualization.

It facilitates direct orchestration between cloud-hosted control surfaces and on-premise hardware endpoints.

---

## ✨ Key Features

- 🖥️ **Interactive Dashboard**: High-level cluster health metrics, power consumption, thermal distribution, and hardware alerts.
- 🏢 **Rack & Hierarchy View**: Multi-rack 42U visualization with live slot assignments, server status, and telemetry inspection.
- 📊 **Real-time Redfish Telemetry**: Instant 0ms cached reads with non-blocking live BMC background synchronization.
- ⚡ **Power & Chassis Controls**: Graceful reboot, hard power cycles, and Chassis Identification LED locator triggers.
- 🎮 **GPU Fleet Monitoring**: NVIDIA / AMD enterprise accelerator metrics (temperatures, power draw, VRAM usage, clock speeds).
- 📦 **Granular Hardware Inventory**: Detailed CPU, DIMM memory, PCIe riser slots, storage drives, and network NIC interfaces.
- 🚨 **Event Logs & Fault Management**: Real-time system event logs (SEL), threshold breach alarms, and event acknowledgments.
- 🛠️ **Diagnostic Suite & Provisioning**: Automated health checks, self-test triggers, and server deployment wizards.
- 🔒 **Role-Based Access Control (RBAC)**: Support for Administrator, Operator, and Read-Only privilege profiles.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Bundler** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Netweb Enterprise Theme |
| **Icons & Visuals** | [Lucide React](https://lucide.dev/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Animations** | [Motion](https://motion.dev/) |
| **Hardware Management API** | Redfish DMTF RESTful API / IPMI Bridge |

---

## 📁 Project Structure

```text
TYRONE/
├── public/                  # Static assets and media
├── src/
│   ├── assets/              # Branding graphics and backgrounds
│   ├── components/          # Reusable UI components & views
│   │   ├── AboutModal.tsx   # Product info, license specs, and contact
│   │   ├── AddServerModal.tsx # BMC discovery and manual device wizard
│   │   ├── Dashboard.tsx    # Primary telemetry summary & analytics
│   │   ├── DeviceHierarchy.tsx # Rack-level slot & hierarchy explorer
│   │   ├── DeviceList.tsx   # Tabular server inventory view
│   │   ├── DiagnosticTools.tsx # Health diagnostics & BMC utilities
│   │   ├── GpuView.tsx      # Enterprise GPU metrics & thermals
│   │   ├── InventoryView.tsx# CPU, RAM, Storage, and PCIe breakdown
│   │   ├── LoginPage.tsx    # Enterprise authentication screen
│   │   ├── LogsAndEvents.tsx# SEL logs, alarms, and sensor graphs
│   │   ├── Navbar.tsx       # Search, profile, and system status bar
│   │   ├── ReportsView.tsx  # Compliance, uptime, and energy reports
│   │   ├── SettingsView.tsx # Configuration and user preferences
│   │   └── Sidebar.tsx      # Collapsible navigation drawer
│   ├── services/            # API endpoints & Redfish integration
│   │   ├── api.ts           # Central storage and telemetry services
│   │   ├── dbService.ts     # Local persistence & state management
│   │   └── redfishService.ts# DMTF Redfish client communication
│   ├── types.ts             # TypeScript definitions & data models
│   ├── App.tsx              # Root application router and controller
│   ├── main.tsx             # Application bootstrap entry point
│   └── index.css            # Tailwind design tokens and custom styles
├── index.html               # Main HTML entry file
├── package.json             # Project dependencies and run scripts
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version `18.x` or higher recommended)
- `npm` (version `9.x` or higher)

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ntwb22/GREEN-DASH-HUH.git
   cd GREEN-DASH-HUH
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

4. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🔐 Default Credentials (Demo)

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |
| **Operator** | `operator` | `operator123` |
| **Read Only** | `viewer` | `viewer123` |

---

## 📬 Contact & Support

For technical support, custom hardware configurations, and license inquiries:

- **Support Email**: [support@netwebindia.com](mailto:support@netwebindia.com)
- **Sales Inquiries**: [sales@netwebindia.com](mailto:sales@netwebindia.com)
- **Official Website**: [www.tyronesystems.com](https://www.tyronesystems.com)

---

<div align="center">
  <sub>Copyright © 2026 Netweb Technologies India Ltd. All rights reserved.</sub>
</div>
