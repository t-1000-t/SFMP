import { useState } from "react";
import ParticlesField from "./ParticlesField";

const CanvasDefault = () => {
  const [count, setCount] = useState(500);
  const [radius, setRadius] = useState(100);
  // const [speed, setSpeed] = useState(40);
  // const [damping, setDamping] = useState(0.985);
  const [color, setColor] = useState("#77f");
  const [bg, setBg] = useState("#03040a");

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <ParticlesField
        count={count}
        linkRadius={radius}
        color={color}
        bgColor={bg}
      />

      {/* Control Panel */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "#0a0f16cc",
          padding: "10px 14px",
          borderRadius: 8,
          color: "#cfe",
          fontFamily: "system-ui",
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        <div>
          <strong>Lesson 10 — Interactive Controls</strong>
        </div>
        <label>
          Count ({count})<br />
          <input
            type="range"
            min={100}
            max={1500}
            value={count}
            onChange={(e) => setCount(+e.target.value)}
          />
        </label>
        <br />
        <label>
          Link Radius ({radius})<br />
          <input
            type="range"
            min={40}
            max={200}
            value={radius}
            onChange={(e) => setRadius(+e.target.value)}
          />
        </label>
        <br />
        <label>
          Color
          <br />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <br />
        <label>
          Background
          <br />
          <input
            type="color"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};

export default CanvasDefault;
