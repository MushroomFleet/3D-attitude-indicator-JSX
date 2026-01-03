# 3D Attitude Indicator JSX

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18+">
  <img src="https://img.shields.io/badge/Three.js-r150+-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/Canvas-2D-FF6B6B?style=for-the-badge" alt="Canvas 2D">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  A high-fidelity, real-time 3D Attitude Indicator (Artificial Horizon) React component inspired by the uAvionix AV-30 glass cockpit display. Perfect for flight simulators, drone telemetry dashboards, spatial tracking applications, and aviation training tools.
</p>

---

## ✨ Features

- **Realistic Attitude Ball** — Sky/ground horizon with gradient textures responding to pitch and roll
- **Pitch Ladder** — Degree markings from 10° to 80° with directional chevrons
- **Bank Angle Indicator** — Arc with tick marks at standard angles (0°, 10°, 20°, 30°, 45°, 60°)
- **Aircraft Symbol** — Fixed reference wings in classic yellow
- **Slip/Skid Ball** — Coordination indicator for balanced flight
- **Rotating Compass Rose** — Heading display with cardinal directions (N, E, S, W)
- **Digital Readouts** — IAS, ALT, VS, DIST, WPT, BARO, SALT
- **Smooth Animations** — Interpolated movements for realistic instrument behavior
- **Two Versions** — Canvas 2D (zero dependencies) and Three.js (full 3D)

---

## 📸 Preview

```
         ┌─────────────────────────┐
         │    GPS ◆ TRK           │
         │       [N]              │
         │    DIST    SALT        │
         │    18.6    0000        │
         │  ╭─────────────────╮   │
         │  │   ═══════════   │   │  ← Sky
         │  │  10────────10   │   │
         │  │       ▼         │   │
         │  ├──●────┼────●──┤ │   │  ← Aircraft Symbol
         │  │       ▲         │   │
         │  │  10────────10   │   │
         │  │   ═══════════   │   │  ← Ground
         │  ╰─────────────────╯   │
         │  IAS 75        14430   │
         │  kts      ALT          │
         │  WPT KABQ   BARO 29.92 │
         │      [AV-30 PUSH-SET]  │
         └─────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/MushroomFleet/3D-attitude-indicator-JSX.git

# Navigate to directory
cd 3D-attitude-indicator-JSX

# Install dependencies (for Three.js version)
npm install three @react-three/fiber @react-three/drei
```

### Basic Usage

```jsx
import React, { useState } from 'react';
import AttitudeIndicatorCanvas from './AttitudeIndicatorCanvas';

function App() {
  const [flightData] = useState({
    pitch: 5,
    roll: -10,
    heading: 270,
    airspeed: 120,
    altitude: 8500,
    verticalSpeed: 500,
    slip: 0,
    baroSetting: 29.92,
    waypoint: 'KDEN',
    distance: 45.2,
  });

  return (
    <AttitudeIndicatorCanvas {...flightData} size={400} />
  );
}

export default App;
```

---

## 📦 Component Versions

| File | Description | Dependencies |
|------|-------------|--------------|
| `AttitudeIndicatorCanvas.jsx` | Pure Canvas 2D implementation | React only |
| `AttitudeIndicator3D.jsx` | Three.js 3D implementation | three, @react-three/fiber, @react-three/drei |

**Recommendation:** Use the Canvas version for maximum compatibility. Use the Three.js version when you need true 3D rendering or are already using React Three Fiber in your project.

---

## ⚙️ Props API

| Prop | Type | Default | Range | Description |
|------|------|---------|-------|-------------|
| `pitch` | `number` | `0` | -90 to 90 | Pitch angle in degrees (+ = nose up) |
| `roll` | `number` | `0` | -180 to 180 | Roll/bank angle in degrees (+ = right wing down) |
| `heading` | `number` | `0` | 0 to 360 | Magnetic heading in degrees |
| `airspeed` | `number` | `0` | 0+ | Indicated airspeed in knots |
| `altitude` | `number` | `0` | any | Altitude in feet |
| `verticalSpeed` | `number` | `0` | ±2000 | Vertical speed in feet/min |
| `slip` | `number` | `0` | -1 to 1 | Slip/skid (-1 = left, +1 = right) |
| `baroSetting` | `number` | `29.92` | 28-31 | Altimeter setting (inHg) |
| `waypoint` | `string` | `'----'` | any | Active waypoint ID |
| `distance` | `number` | `0` | 0+ | Distance to waypoint (nm) |
| `size` | `number` | `400` | 100+ | Component size in pixels |

---

## 🔌 Integration Examples

### WebSocket Real-Time Data

```jsx
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080/flight-data');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setFlightData(data);
  };

  return () => ws.close();
}, []);
```

### Flight Simulator (X-Plane / MSFS)

```jsx
// Connect via SimConnect bridge or X-Plane UDP
const eventSource = new EventSource('/api/sim-stream');
eventSource.onmessage = (e) => setFlightData(JSON.parse(e.data));
```

### IMU Sensor / Drone Telemetry

```jsx
// Web Serial API for hardware sensors
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 115200 });
// Parse IMU quaternion → Euler angles
```

### Mobile Device Orientation

```jsx
window.addEventListener('deviceorientation', (e) => {
  setFlightData({
    pitch: e.beta,
    roll: e.gamma,
    heading: e.alpha,
  });
});
```

> 📘 See **[attitude-integration-guide.md](./attitude-integration-guide.md)** for complete integration documentation.

---

## 🎨 Customization

### Color Themes

Modify the `COLORS` constant in the component:

```javascript
const COLORS = {
  sky: '#1a6eb5',        // Horizon sky color
  ground: '#6b4423',     // Horizon ground color
  textGreen: '#00ff00',  // Primary readouts
  textCyan: '#00ffff',   // Altitude display
  textMagenta: '#ff00ff', // Navigation data
  aircraft: '#ffff00',   // Aircraft symbol
  // ... more options
};
```

### Night Mode

```javascript
const COLORS_NIGHT = {
  sky: '#0a2e4a',
  ground: '#3d2010',
  textGreen: '#00aa00',
  // ... dimmed colors
};
```

---

## 📁 Project Structure

```
3D-attitude-indicator-JSX/
├── AttitudeIndicatorCanvas.jsx    # Canvas 2D component (recommended)
├── AttitudeIndicator3D.jsx        # Three.js 3D component
├── attitude-integration-guide.md  # Detailed integration docs
├── README.md                      # This file
└── LICENSE                        # MIT License
```

---

## 🛠️ Development

```bash
# Run in development mode
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 📋 Use Cases

- ✈️ **Flight Simulators** — Glass cockpit displays
- 🚁 **Drone Ground Stations** — Real-time attitude monitoring
- 🎮 **Aviation Games** — Realistic instrument panels
- 📡 **Telemetry Dashboards** — Spatial orientation visualization
- 🎓 **Training Applications** — Pilot education tools
- 🤖 **Robotics** — IMU data visualization
- 📱 **Mobile Apps** — Device orientation display

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{3d_attitude_indicator_jsx,
  title = {3D Attitude Indicator JSX: Real-time Aviation Instrument Component for React},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/3D-attitude-indicator-JSX},
  version = {1.0.0}
}
```

### Donate:

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)
