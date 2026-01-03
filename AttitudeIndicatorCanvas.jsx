import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  sky: '#1a6eb5',
  skyDark: '#0d4a7a',
  ground: '#6b4423',
  groundDark: '#3d2615',
  horizon: '#ffffff',
  bezel: '#1a1a1a',
  bezelHighlight: '#2a2a2a',
  textGreen: '#00ff00',
  textCyan: '#00ffff',
  textMagenta: '#ff00ff',
  textWhite: '#ffffff',
  textYellow: '#ffff00',
  aircraft: '#ffff00',
  slipBall: '#ffffff',
};

// ============================================================================
// ATTITUDE INDICATOR CANVAS COMPONENT
// ============================================================================

function AttitudeIndicatorCanvas({ pitch, roll, heading, airspeed, altitude, verticalSpeed, slip, baroSetting, waypoint, distance, size }) {
  const canvasRef = useRef(null);
  const animatedPitch = useRef(pitch);
  const animatedRoll = useRef(roll);
  const animatedHeading = useRef(heading);
  const animatedSlip = useRef(slip);

  const lerp = (a, b, t) => a + (b - a) * t;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 10;

    // Smooth animations
    animatedPitch.current = lerp(animatedPitch.current, pitch, 0.15);
    animatedRoll.current = lerp(animatedRoll.current, roll, 0.15);
    animatedSlip.current = lerp(animatedSlip.current, slip, 0.12);
    
    // Handle heading wraparound
    let headingDiff = heading - animatedHeading.current;
    if (headingDiff > 180) headingDiff -= 360;
    if (headingDiff < -180) headingDiff += 360;
    animatedHeading.current += headingDiff * 0.15;

    const p = animatedPitch.current;
    const r = animatedRoll.current * Math.PI / 180;
    const hdg = animatedHeading.current;

    // Clear
    ctx.fillStyle = COLORS.bezel;
    ctx.fillRect(0, 0, w, h);

    // Save state and clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
    ctx.clip();

    // Draw attitude ball
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-r);

    const pitchPixels = p * (radius / 30); // 30 degrees = full radius

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, -radius * 2, 0, pitchPixels);
    skyGrad.addColorStop(0, COLORS.skyDark);
    skyGrad.addColorStop(1, COLORS.sky);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 2 + pitchPixels);

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, pitchPixels, 0, radius * 2);
    groundGrad.addColorStop(0, COLORS.ground);
    groundGrad.addColorStop(1, COLORS.groundDark);
    ctx.fillStyle = groundGrad;
    ctx.fillRect(-radius * 2, pitchPixels, radius * 4, radius * 2);

    // Horizon line
    ctx.strokeStyle = COLORS.horizon;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 2, pitchPixels);
    ctx.lineTo(radius * 2, pitchPixels);
    ctx.stroke();

    // Pitch ladder
    ctx.font = `${radius * 0.06}px monospace`;
    ctx.fillStyle = COLORS.textWhite;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let deg = -80; deg <= 80; deg += 10) {
      if (deg === 0) continue;
      const y = pitchPixels - deg * (radius / 30);
      const lineWidth = Math.abs(deg) % 20 === 0 ? radius * 0.25 : radius * 0.15;
      
      ctx.strokeStyle = COLORS.textWhite;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-lineWidth, y);
      ctx.lineTo(lineWidth, y);
      ctx.stroke();

      // Chevrons for negative pitch
      if (deg < 0) {
        ctx.beginPath();
        ctx.moveTo(-lineWidth, y);
        ctx.lineTo(-lineWidth, y + 8);
        ctx.moveTo(lineWidth, y);
        ctx.lineTo(lineWidth, y + 8);
        ctx.stroke();
      }

      // Labels
      if (Math.abs(deg) % 10 === 0) {
        ctx.fillText(Math.abs(deg).toString(), -lineWidth - 15, y);
        ctx.fillText(Math.abs(deg).toString(), lineWidth + 15, y);
      }
    }

    ctx.restore();
    ctx.restore();

    // Bank angle indicator arc
    ctx.save();
    ctx.translate(cx, cy);
    
    // Arc background
    ctx.strokeStyle = '#333';
    ctx.lineWidth = radius * 0.06;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, Math.PI * 1.17, Math.PI * 1.83);
    ctx.stroke();

    // Bank tick marks
    const bankAngles = [
      { deg: 0, len: 0.1 },
      { deg: 10, len: 0.06 },
      { deg: 20, len: 0.06 },
      { deg: 30, len: 0.1 },
      { deg: 45, len: 0.06 },
      { deg: 60, len: 0.1 },
    ];

    ctx.strokeStyle = COLORS.textWhite;
    ctx.lineWidth = 2;
    
    bankAngles.forEach(({ deg, len }) => {
      [deg, -deg].forEach(angle => {
        const rad = (-90 + angle) * Math.PI / 180;
        const r1 = radius * 0.78;
        const r2 = radius * (0.78 + len);
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
        ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
        ctx.stroke();
      });
    });

    // Fixed sky pointer (top triangle)
    ctx.fillStyle = COLORS.aircraft;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.88);
    ctx.lineTo(-8, -radius * 0.78);
    ctx.lineTo(8, -radius * 0.78);
    ctx.closePath();
    ctx.fill();

    // Moving bank pointer
    ctx.save();
    ctx.rotate(-r);
    ctx.fillStyle = COLORS.textWhite;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.76);
    ctx.lineTo(-6, -radius * 0.68);
    ctx.lineTo(6, -radius * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Aircraft symbol (fixed)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = COLORS.aircraft;
    ctx.fillStyle = COLORS.aircraft;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.beginPath();
    ctx.moveTo(-radius * 0.35, 0);
    ctx.lineTo(-radius * 0.12, 0);
    ctx.moveTo(radius * 0.12, 0);
    ctx.lineTo(radius * 0.35, 0);
    ctx.stroke();

    // Wing tips
    ctx.beginPath();
    ctx.moveTo(-radius * 0.35, 0);
    ctx.lineTo(-radius * 0.35, 12);
    ctx.moveTo(radius * 0.35, 0);
    ctx.lineTo(radius * 0.35, 12);
    ctx.stroke();

    ctx.restore();

    // Slip/skid indicator
    ctx.save();
    ctx.translate(cx, cy + radius * 0.55);
    
    // Tube
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-radius * 0.2, -8, radius * 0.4, 16);
    
    // Center marks
    ctx.fillStyle = '#444';
    ctx.fillRect(-radius * 0.06 - 2, -10, 4, 20);
    ctx.fillRect(radius * 0.06 - 2, -10, 4, 20);
    
    // Ball
    const ballOffset = animatedSlip.current * radius * 0.12;
    ctx.fillStyle = COLORS.slipBall;
    ctx.beginPath();
    ctx.arc(ballOffset, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // Compass rose at top
    ctx.save();
    ctx.translate(cx, cy - radius * 0.68);
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Rotating compass
    ctx.save();
    ctx.rotate(hdg * Math.PI / 180);
    
    const compassRadius = radius * 0.18;
    ctx.font = `${radius * 0.055}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 36; i++) {
      const deg = i * 10;
      const rad = -deg * Math.PI / 180;
      const isMajor = deg % 30 === 0;
      
      // Tick marks
      ctx.strokeStyle = COLORS.textWhite;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const r1 = compassRadius * (isMajor ? 0.7 : 0.85);
      ctx.moveTo(Math.sin(rad) * r1, -Math.cos(rad) * r1);
      ctx.lineTo(Math.sin(rad) * compassRadius, -Math.cos(rad) * compassRadius);
      ctx.stroke();

      // Labels
      if (isMajor) {
        let label = '';
        if (deg === 0) label = 'N';
        else if (deg === 90) label = 'E';
        else if (deg === 180) label = 'S';
        else if (deg === 270) label = 'W';
        else label = (deg / 10).toString();

        ctx.save();
        ctx.translate(Math.sin(rad) * compassRadius * 0.5, -Math.cos(rad) * compassRadius * 0.5);
        ctx.rotate(rad);
        ctx.fillStyle = label === 'N' ? COLORS.textMagenta : COLORS.textWhite;
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    // Fixed heading marker
    ctx.fillStyle = COLORS.textMagenta;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.2);
    ctx.lineTo(-5, -radius * 0.14);
    ctx.lineTo(5, -radius * 0.14);
    ctx.closePath();
    ctx.fill();

    // GPS/TRK labels
    ctx.font = `${radius * 0.04}px monospace`;
    ctx.fillStyle = COLORS.textWhite;
    ctx.fillText('GPS', -radius * 0.12, radius * 0.12);
    ctx.fillText('TRK', radius * 0.12, radius * 0.12);

    ctx.restore();

    // Data displays
    ctx.font = `bold ${radius * 0.09}px monospace`;
    
    // Left side - IAS
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('IAS', cx - radius * 0.82, cy - radius * 0.35);
    ctx.fillStyle = COLORS.textGreen;
    ctx.font = `bold ${radius * 0.11}px monospace`;
    ctx.fillText(Math.round(airspeed).toString(), cx - radius * 0.82, cy - radius * 0.22);
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.06}px monospace`;
    ctx.fillText('kts', cx - radius * 0.58, cy - radius * 0.22);

    // Right side - ALT
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('ALT', cx + radius * 0.82, cy - radius * 0.35);
    ctx.fillStyle = COLORS.textCyan;
    ctx.font = `bold ${radius * 0.11}px monospace`;
    ctx.fillText(Math.round(altitude).toString(), cx + radius * 0.82, cy - radius * 0.22);

    // DIST (top left)
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('DIST', cx - radius * 0.82, cy - radius * 0.58);
    ctx.fillStyle = COLORS.textMagenta;
    ctx.font = `bold ${radius * 0.09}px monospace`;
    ctx.fillText(distance.toFixed(1), cx - radius * 0.82, cy - radius * 0.46);

    // SALT (top right)
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('SALT', cx + radius * 0.82, cy - radius * 0.58);
    ctx.fillStyle = COLORS.textCyan;
    ctx.font = `bold ${radius * 0.08}px monospace`;
    ctx.fillText('0000', cx + radius * 0.82, cy - radius * 0.46);

    // WPT (bottom left)
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('WPT', cx - radius * 0.82, cy + radius * 0.35);
    ctx.fillStyle = COLORS.textMagenta;
    ctx.font = `bold ${radius * 0.08}px monospace`;
    ctx.fillText(waypoint, cx - radius * 0.82, cy + radius * 0.46);

    // BARO (bottom right)
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('BARO', cx + radius * 0.82, cy + radius * 0.35);
    ctx.fillStyle = COLORS.textCyan;
    ctx.font = `bold ${radius * 0.08}px monospace`;
    ctx.fillText(baroSetting.toFixed(2), cx + radius * 0.82, cy + radius * 0.46);

    // VS indicator (right side tape)
    const vsX = cx + radius * 0.92;
    const vsHeight = radius * 0.5;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(vsX - 8, cy - vsHeight / 2, 16, vsHeight);
    
    // VS scale marks
    ctx.strokeStyle = COLORS.textWhite;
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const y = cy - (i / 2) * (vsHeight / 2) * 0.8;
      ctx.beginPath();
      ctx.moveTo(vsX - 6, y);
      ctx.lineTo(vsX + 6, y);
      ctx.stroke();
    }

    // VS pointer
    const vsNormalized = Math.max(-2000, Math.min(2000, verticalSpeed)) / 2000;
    const vsPointerY = cy - vsNormalized * (vsHeight / 2) * 0.8;
    ctx.fillStyle = COLORS.textGreen;
    ctx.beginPath();
    ctx.moveTo(vsX - 12, vsPointerY);
    ctx.lineTo(vsX + 4, vsPointerY - 4);
    ctx.lineTo(vsX + 4, vsPointerY + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.045}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('VT', vsX - 2, cy - vsHeight / 2 - 8);

    // Bottom labels
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.045}px monospace`;
    ctx.fillText('MENU', cx - radius * 0.5, cy + radius * 0.68);
    ctx.fillText('AoA', cx, cy + radius * 0.68);

    // Status bar
    ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
    ctx.fillRect(cx - radius * 0.5, cy + radius * 0.72, radius, radius * 0.1);
    
    ctx.fillStyle = COLORS.textGreen;
    ctx.font = `${radius * 0.045}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('3:3', cx - radius * 0.1, cy + radius * 0.78);
    ctx.fillText('100%', cx + radius * 0.2, cy + radius * 0.78);
    
    // Battery icon
    ctx.fillStyle = COLORS.textGreen;
    ctx.fillRect(cx + radius * 0.35, cy + radius * 0.75, radius * 0.06, radius * 0.05);

    // Bezel
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = radius * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom text
    ctx.fillStyle = COLORS.textWhite;
    ctx.font = `${radius * 0.07}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('AV-30', cx - radius * 0.15, cy + radius * 0.92);
    ctx.font = `${radius * 0.05}px monospace`;
    ctx.fillText('PUSH-SET', cx + radius * 0.25, cy + radius * 0.92);

  }, [pitch, roll, heading, airspeed, altitude, verticalSpeed, slip, baroSetting, waypoint, distance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size * 2}
      height={size * 2}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
      }}
    />
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [flightData, setFlightData] = useState({
    pitch: 2.5,
    roll: 0,
    heading: 3,
    airspeed: 75,
    altitude: 14430,
    verticalSpeed: 0,
    slip: 0,
    baroSetting: 29.92,
    waypoint: 'KABQ',
    distance: 18.6,
  });

  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    let time = 0;
    const interval = setInterval(() => {
      time += 0.05;
      setFlightData(prev => ({
        ...prev,
        pitch: 2.5 + Math.sin(time * 0.3) * 8 + Math.sin(time * 0.7) * 3,
        roll: Math.sin(time * 0.2) * 20 + Math.sin(time * 0.5) * 8,
        heading: (prev.heading + 0.15 + Math.sin(time * 0.1) * 0.3 + 360) % 360,
        airspeed: 75 + Math.sin(time * 0.4) * 15,
        altitude: 14430 + Math.sin(time * 0.15) * 300,
        verticalSpeed: Math.cos(time * 0.15) * 800,
        slip: Math.sin(time * 0.25) * 0.5,
        distance: Math.max(0, 18.6 - (time * 0.005)),
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleSliderChange = (key, value) => {
    setIsAnimating(false);
    setFlightData(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0d1117 0%, #161b22 50%, #1a1f29 100%)',
      padding: '24px',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          color: '#00ff88',
          fontSize: '24px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '4px',
          textShadow: '0 0 30px rgba(0, 255, 136, 0.5)',
          margin: 0,
        }}>
          3D Attitude Indicator
        </h1>
        <p style={{
          color: '#8b949e',
          fontSize: '11px',
          letterSpacing: '2px',
          marginTop: '8px',
        }}>
          AV-30 Style • Real-time Flight Data
        </p>
      </div>

      <div style={{
        position: 'relative',
        borderRadius: '50%',
        boxShadow: '0 0 60px rgba(0, 255, 136, 0.15), 0 20px 60px rgba(0, 0, 0, 0.8)',
      }}>
        <AttitudeIndicatorCanvas {...flightData} size={380} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '20px',
        background: 'rgba(22, 27, 34, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(48, 54, 61, 0.6)',
        width: '100%',
        maxWidth: '420px',
      }}>
        {[
          { label: 'Pitch', value: `${flightData.pitch.toFixed(1)}°`, color: '#00ff88' },
          { label: 'Roll', value: `${flightData.roll.toFixed(1)}°`, color: '#00ff88' },
          { label: 'Heading', value: `${flightData.heading.toFixed(0)}°`, color: '#ffcc00' },
          { label: 'Airspeed', value: `${flightData.airspeed.toFixed(0)} kts`, color: '#00ff88' },
          { label: 'Altitude', value: `${flightData.altitude.toFixed(0)} ft`, color: '#00d4ff' },
          { label: 'V/S', value: `${flightData.verticalSpeed.toFixed(0)} fpm`, color: '#ff00ff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ color: '#8b949e', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ color, fontSize: '16px', fontWeight: 500, textShadow: `0 0 10px ${color}40` }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '20px',
        background: 'rgba(22, 27, 34, 0.8)',
        borderRadius: '12px',
        border: '1px solid rgba(48, 54, 61, 0.6)',
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: '#8b949e', fontSize: '11px', textTransform: 'uppercase' }}>Manual Controls</span>
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            style={{
              padding: '8px 20px',
              background: isAnimating ? 'rgba(255, 100, 100, 0.2)' : 'rgba(0, 255, 136, 0.2)',
              border: `1px solid ${isAnimating ? '#ff6464' : '#00ff88'}`,
              color: isAnimating ? '#ff6464' : '#00ff88',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {isAnimating ? 'Stop' : 'Animate'}
          </button>
        </div>

        {[
          { key: 'pitch', label: 'Pitch', min: -45, max: 45, unit: '°' },
          { key: 'roll', label: 'Roll', min: -60, max: 60, unit: '°' },
          { key: 'heading', label: 'Heading', min: 0, max: 360, unit: '°' },
          { key: 'airspeed', label: 'Airspeed', min: 0, max: 200, unit: ' kts' },
          { key: 'altitude', label: 'Altitude', min: 0, max: 30000, unit: ' ft' },
        ].map(({ key, label, min, max, unit }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#8b949e', fontSize: '11px', textTransform: 'uppercase', width: '70px' }}>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={key === 'altitude' ? 100 : 0.5}
              value={flightData[key]}
              onChange={(e) => handleSliderChange(key, e.target.value)}
              style={{
                flex: 1,
                accentColor: '#00ff88',
                height: '4px',
              }}
            />
            <span style={{ color: '#00ff88', fontSize: '11px', width: '65px', textAlign: 'right' }}>
              {key === 'heading' ? flightData[key].toFixed(0) : flightData[key].toFixed(1)}{unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
