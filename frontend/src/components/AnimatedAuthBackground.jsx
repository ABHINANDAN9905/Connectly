import React from "react";

const AnimatedAuthBackground = () => {
  const particles = [
    { left: "7%", top: "15%", color: "#FF6A00", delay: "0s", size: 6 },
    { left: "18%", top: "35%", color: "#8B5CF6", delay: "1s", size: 5 },
    { left: "12%", top: "68%", color: "#EC4899", delay: "2s", size: 6 },
    { left: "30%", top: "22%", color: "#3B82F6", delay: "3s", size: 5 },
    { left: "38%", top: "75%", color: "#FF6A00", delay: "1.5s", size: 6 },
    { left: "52%", top: "12%", color: "#06B6D4", delay: "2.5s", size: 5 },
    { left: "67%", top: "24%", color: "#8B5CF6", delay: "0.5s", size: 6 },
    { left: "86%", top: "16%", color: "#3B82F6", delay: "3.5s", size: 5 },
    { left: "91%", top: "48%", color: "#22C55E", delay: "1s", size: 6 },
    { left: "88%", top: "78%", color: "#EC4899", delay: "2s", size: 5 },
    { left: "70%", top: "82%", color: "#FF6A00", delay: "4s", size: 6 },
    { left: "50%", top: "90%", color: "#8B5CF6", delay: "2.5s", size: 5 },
  ];

  return (
    <div className="auth-background" aria-hidden="true">

      {/* ===============================
          SOFT FLOATING ORBS
      =============================== */}

      <div className="auth-orb auth-orb-orange" />
      <div className="auth-orb auth-orb-purple" />
      <div className="auth-orb auth-orb-blue" />
      <div className="auth-orb auth-orb-pink" />
      <div className="auth-orb auth-orb-cyan" />

      {/* ===============================
          CONNECTED NETWORK
      =============================== */}

      <svg
        className="auth-network"
        viewBox="0 0 1000 800"
        preserveAspectRatio="none"
      >
        <line x1="80" y1="120" x2="220" y2="250" />
        <line x1="220" y1="250" x2="350" y2="150" />
        <line x1="220" y1="250" x2="150" y2="480" />

        <line x1="350" y1="150" x2="570" y2="110" />
        <line x1="570" y1="110" x2="720" y2="220" />

        <line x1="720" y1="220" x2="880" y2="140" />
        <line x1="720" y1="220" x2="820" y2="410" />

        <line x1="820" y1="410" x2="920" y2="590" />

        <line x1="570" y1="110" x2="520" y2="650" />
        <line x1="520" y1="650" x2="680" y2="720" />

        <line x1="150" y1="480" x2="420" y2="690" />
        <line x1="420" y1="690" x2="520" y2="650" />
      </svg>

      {/* ===============================
          GLOWING PARTICLES
      =============================== */}

      {particles.map((particle, index) => (
        <span
          key={index}
          className="auth-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 14px ${particle.color}`,
            animationDelay: particle.delay,
          }}
        />
      ))}

      {/* ===============================
          SUBTLE GRID
      =============================== */}

      <div className="auth-grid" />

      {/* ===============================
          CENTER GLOW
      =============================== */}

      <div className="auth-center-glow" />

    </div>
  );
};

export default AnimatedAuthBackground;