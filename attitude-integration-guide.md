# Attitude Indicator Integration Guide

This guide provides comprehensive instructions for integrating the 3D Attitude Indicator component into your React application. The component is designed to be flexible and can be adapted to work with various data sources including flight simulators, IMU sensors, telemetry systems, and real-time spatial tracking applications.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Basic Integration](#basic-integration)
4. [Props Reference](#props-reference)
5. [Data Source Integration](#data-source-integration)
6. [Customization](#customization)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before integrating the Attitude Indicator, ensure your project meets the following requirements:

### For Canvas Version (AttitudeIndicatorCanvas.jsx)
- React 16.8+ (Hooks support)
- No additional dependencies required

### For Three.js Version (AttitudeIndicator3D.jsx)
- React 16.8+
- Three.js ecosystem packages:

```bash
npm install three @react-three/fiber @react-three/drei
# or
yarn add three @react-three/fiber @react-three/drei
```

---

## Installation

### Step 1: Copy Component Files

Copy the appropriate component file(s) to your project's component directory:

```
your-project/
├── src/
│   ├── components/
│   │   ├── AttitudeIndicator/
│   │   │   ├── AttitudeIndicatorCanvas.jsx   # Canvas version
│   │   │   ├── AttitudeIndicator3D.jsx       # Three.js version
│   │   │   └── index.js                      # Export file
```

### Step 2: Create Index Export (Optional)

Create an `index.js` for cleaner imports:

```javascript
// src/components/AttitudeIndicator/index.js
export { default as AttitudeIndicatorCanvas } from './AttitudeIndicatorCanvas';
export { default as AttitudeIndicator3D } from './AttitudeIndicator3D';
```

---

## Basic Integration

### Minimal Example

```jsx
import React, { useState } from 'react';
import AttitudeIndicatorCanvas from './components/AttitudeIndicator/AttitudeIndicatorCanvas';

function App() {
  const [flightData, setFlightData] = useState({
    pitch: 0,
    roll: 0,
    heading: 0,
    airspeed: 120,
    altitude: 5000,
    verticalSpeed: 0,
    slip: 0,
    baroSetting: 29.92,
    waypoint: 'KJFK',
    distance: 45.0,
  });

  return (
    <div className="cockpit-panel">
      <AttitudeIndicatorCanvas {...flightData} size={400} />
    </div>
  );
}

export default App;
```

### With Real-Time Updates

```jsx
import React, { useState, useEffect } from 'react';
import AttitudeIndicatorCanvas from './components/AttitudeIndicator/AttitudeIndicatorCanvas';

function FlightDisplay({ dataSource }) {
  const [flightData, setFlightData] = useState({
    pitch: 0,
    roll: 0,
    heading: 0,
    airspeed: 0,
    altitude: 0,
    verticalSpeed: 0,
    slip: 0,
    baroSetting: 29.92,
    waypoint: '----',
    distance: 0,
  });

  useEffect(() => {
    // Subscribe to your data source
    const unsubscribe = dataSource.subscribe((data) => {
      setFlightData({
        pitch: data.pitch,
        roll: data.roll,
        heading: data.heading,
        airspeed: data.ias,
        altitude: data.alt,
        verticalSpeed: data.vs,
        slip: data.slipSkid,
        baroSetting: data.baro,
        waypoint: data.activeWaypoint,
        distance: data.distanceToWaypoint,
      });
    });

    return () => unsubscribe();
  }, [dataSource]);

  return <AttitudeIndicatorCanvas {...flightData} size={380} />;
}
```

---

## Props Reference

| Prop | Type | Default | Range | Description |
|------|------|---------|-------|-------------|
| `pitch` | number | `0` | -90 to 90 | Aircraft pitch in degrees (positive = nose up) |
| `roll` | number | `0` | -180 to 180 | Aircraft roll/bank in degrees (positive = right wing down) |
| `heading` | number | `0` | 0 to 360 | Magnetic heading in degrees |
| `airspeed` | number | `0` | 0+ | Indicated airspeed in knots |
| `altitude` | number | `0` | any | Altitude in feet |
| `verticalSpeed` | number | `0` | -2000 to 2000 | Vertical speed in feet per minute |
| `slip` | number | `0` | -1 to 1 | Slip/skid indicator (-1 = full left, 1 = full right) |
| `baroSetting` | number | `29.92` | 28.0 to 31.0 | Barometric pressure setting (inches Hg) |
| `waypoint` | string | `'----'` | any | Active waypoint identifier |
| `distance` | number | `0` | 0+ | Distance to waypoint in nautical miles |
| `size` | number | `400` | 100+ | Component size in pixels |

---

## Data Source Integration

### WebSocket Connection

```jsx
import React, { useState, useEffect, useRef } from 'react';
import AttitudeIndicatorCanvas from './components/AttitudeIndicator/AttitudeIndicatorCanvas';

function WebSocketFlightDisplay({ wsUrl }) {
  const [flightData, setFlightData] = useState({ /* defaults */ });
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFlightData(prev => ({
        ...prev,
        pitch: data.pitch ?? prev.pitch,
        roll: data.roll ?? prev.roll,
        heading: data.heading ?? prev.heading,
        airspeed: data.airspeed ?? prev.airspeed,
        altitude: data.altitude ?? prev.altitude,
        verticalSpeed: data.verticalSpeed ?? prev.verticalSpeed,
      }));
    };

    return () => wsRef.current?.close();
  }, [wsUrl]);

  return <AttitudeIndicatorCanvas {...flightData} size={400} />;
}
```

### Flight Simulator Integration (SimConnect / X-Plane)

```jsx
// Example: X-Plane UDP Data Integration
import React, { useState, useEffect } from 'react';

function XPlaneDisplay() {
  const [flightData, setFlightData] = useState({ /* defaults */ });

  useEffect(() => {
    // Assuming you have a backend service parsing X-Plane UDP
    const eventSource = new EventSource('/api/xplane-stream');

    eventSource.onmessage = (event) => {
      const xpData = JSON.parse(event.data);
      
      setFlightData({
        pitch: xpData.pitch_deg,
        roll: xpData.roll_deg,
        heading: xpData.heading_mag,
        airspeed: xpData.ias_kts,
        altitude: xpData.alt_ftmsl,
        verticalSpeed: xpData.vvi_fpm,
        slip: xpData.slip_deg / 15, // Normalize to -1 to 1
        baroSetting: xpData.baro_inhg,
        waypoint: xpData.nav1_id || '----',
        distance: xpData.nav1_dme || 0,
      });
    };

    return () => eventSource.close();
  }, []);

  return <AttitudeIndicatorCanvas {...flightData} size={400} />;
}
```

### IMU Sensor Integration (Web Bluetooth / Serial)

```jsx
// Example: IMU sensor via Web Serial API
import React, { useState, useCallback } from 'react';

function IMUDisplay() {
  const [flightData, setFlightData] = useState({
    pitch: 0,
    roll: 0,
    heading: 0,
    // ... other defaults
  });
  const [isConnected, setIsConnected] = useState(false);

  const connectIMU = useCallback(async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      const reader = port.readable.getReader();
      setIsConnected(true);

      const processData = async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          // Parse IMU data (format depends on your sensor)
          const text = new TextDecoder().decode(value);
          const [roll, pitch, yaw] = text.split(',').map(Number);

          setFlightData(prev => ({
            ...prev,
            pitch: pitch,
            roll: roll,
            heading: (yaw + 360) % 360,
          }));
        }
      };

      processData();
    } catch (error) {
      console.error('IMU connection failed:', error);
    }
  }, []);

  return (
    <div>
      <button onClick={connectIMU} disabled={isConnected}>
        {isConnected ? 'Connected' : 'Connect IMU'}
      </button>
      <AttitudeIndicatorCanvas {...flightData} size={400} />
    </div>
  );
}
```

### Device Orientation API (Mobile)

```jsx
import React, { useState, useEffect } from 'react';

function MobileAttitudeDisplay() {
  const [orientation, setOrientation] = useState({
    pitch: 0,
    roll: 0,
    heading: 0,
  });

  useEffect(() => {
    const handleOrientation = (event) => {
      setOrientation({
        pitch: event.beta,   // -180 to 180 (front-to-back tilt)
        roll: event.gamma,   // -90 to 90 (left-to-right tilt)
        heading: event.alpha, // 0 to 360 (compass direction)
      });
    };

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return (
    <AttitudeIndicatorCanvas
      pitch={orientation.pitch}
      roll={orientation.roll}
      heading={orientation.heading}
      airspeed={0}
      altitude={0}
      verticalSpeed={0}
      slip={0}
      baroSetting={29.92}
      waypoint="----"
      distance={0}
      size={350}
    />
  );
}
```

---

## Customization

### Modifying Colors

Edit the `COLORS` constant at the top of the component file:

```javascript
const COLORS = {
  sky: '#1a6eb5',           // Sky blue
  skyDark: '#0d4a7a',       // Sky gradient top
  ground: '#6b4423',        // Ground brown
  groundDark: '#3d2615',    // Ground gradient bottom
  horizon: '#ffffff',       // Horizon line
  bezel: '#1a1a1a',         // Instrument bezel
  textGreen: '#00ff00',     // Primary data (airspeed)
  textCyan: '#00ffff',      // Altitude display
  textMagenta: '#ff00ff',   // Navigation data
  textWhite: '#ffffff',     // Labels
  textYellow: '#ffff00',    // Warnings
  aircraft: '#ffff00',      // Aircraft symbol
  slipBall: '#ffffff',      // Slip indicator ball
};
```

### Night Mode Theme

```javascript
const COLORS_NIGHT = {
  sky: '#0a2e4a',
  skyDark: '#051a2e',
  ground: '#3d2010',
  groundDark: '#1f1008',
  horizon: '#ff6600',
  bezel: '#0a0a0a',
  textGreen: '#00aa00',
  textCyan: '#00aaaa',
  textMagenta: '#aa00aa',
  textWhite: '#aaaaaa',
  aircraft: '#ff6600',
  slipBall: '#888888',
};
```

### Adding Custom Data Fields

To add additional data displays, modify the `DataDisplays` section in the canvas drawing code:

```javascript
// Add after existing data displays
ctx.textAlign = 'center';
ctx.fillStyle = COLORS.textWhite;
ctx.font = `${radius * 0.05}px monospace`;
ctx.fillText('G-LOAD', cx, cy + radius * 0.8);
ctx.fillStyle = COLORS.textGreen;
ctx.font = `bold ${radius * 0.08}px monospace`;
ctx.fillText(gLoad.toFixed(1) + 'G', cx, cy + radius * 0.88);
```

### Responsive Sizing

```jsx
import React, { useState, useEffect } from 'react';

function ResponsiveAttitudeIndicator(props) {
  const [size, setSize] = useState(400);

  useEffect(() => {
    const handleResize = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      setSize(Math.min(400, minDimension * 0.8));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <AttitudeIndicatorCanvas {...props} size={size} />;
}
```

---

## Performance Optimization

### Throttling Updates

For high-frequency data sources, throttle updates to maintain 60fps:

```jsx
import React, { useState, useEffect, useRef } from 'react';

function ThrottledDisplay({ dataSource }) {
  const [displayData, setDisplayData] = useState({ /* defaults */ });
  const latestData = useRef(displayData);
  const rafId = useRef(null);

  useEffect(() => {
    const updateDisplay = () => {
      setDisplayData({ ...latestData.current });
      rafId.current = requestAnimationFrame(updateDisplay);
    };

    rafId.current = requestAnimationFrame(updateDisplay);

    const unsubscribe = dataSource.subscribe((data) => {
      latestData.current = data; // Store latest, don't trigger render
    });

    return () => {
      cancelAnimationFrame(rafId.current);
      unsubscribe();
    };
  }, [dataSource]);

  return <AttitudeIndicatorCanvas {...displayData} size={400} />;
}
```

### Memoization

Wrap the component with React.memo to prevent unnecessary re-renders:

```jsx
import React, { memo } from 'react';

const MemoizedIndicator = memo(AttitudeIndicatorCanvas, (prev, next) => {
  // Custom comparison - only re-render if values changed significantly
  return (
    Math.abs(prev.pitch - next.pitch) < 0.1 &&
    Math.abs(prev.roll - next.roll) < 0.1 &&
    Math.abs(prev.heading - next.heading) < 0.5
  );
});
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank/white screen | Three.js not installed | Use Canvas version or install dependencies |
| Jerky animation | Too many state updates | Implement throttling (see above) |
| Heading jumps at 360°/0° | Wraparound not handled | Component handles this internally |
| Blurry display | Low pixel density | Canvas uses 2x resolution by default |
| Slow performance | Large size value | Keep size under 500px or optimize |

### Debug Mode

Add debug overlay to visualize raw values:

```jsx
function DebugWrapper({ children, data }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <pre style={{
        position: 'absolute',
        top: 0,
        left: '100%',
        marginLeft: '1rem',
        fontSize: '10px',
        background: '#000',
        color: '#0f0',
        padding: '8px',
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
```

---

## Support

For issues, feature requests, or contributions, visit:
**https://github.com/MushroomFleet/3D-attitude-indicator-JSX**

---

*Last updated: January 2025*
