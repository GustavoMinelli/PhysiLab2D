import { useEffect, useRef } from 'react';
import {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
} from 'matter-js';

function App() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Get responsive size based on container width and viewport height
    const getSize = () => {
      const el = sceneRef.current!;
      const availableWidth = el.clientWidth || window.innerWidth;
      const availableHeight = Math.floor(window.innerHeight * 0.6); // up to 60vh
      const size = Math.max(320, Math.min(availableWidth - 40, availableHeight)); // keep reasonable minimum with margins
      return { width: size, height: size };
    };

    let { width, height } = getSize();
    const engine = Engine.create({ enableSleeping: false });
    engine.gravity.y = 0;

    const render = Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#181818',
      },
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

  // Parameters (mutable to support responsive resize)
  let center = { x: width / 2, y: height / 2 };
  let L = Math.min(width, height) * 0.15; // rod length (smaller to better fit in center)
    const thickness = 10;

    // Two rods as kinematic bodies (we manually move them each step)
    // Initial positions will be updated immediately in handleResize()
    const rod1 = Bodies.rectangle(
      center.x,
      center.y,
      L,
      thickness,
      {
        isStatic: true,
        render: { fillStyle: '#00bcd4' },
        collisionFilter: { group: -1 },
      }
    );
    const rod2 = Bodies.rectangle(
      center.x,
      center.y,
      L,
      thickness,
      {
        isStatic: true,
        render: { fillStyle: '#e91e63' },
        collisionFilter: { group: -1 },
      }
    );

    Composite.add(engine.world, [rod1, rod2]);

    // Trail of the endpoint
    const trail: { x: number; y: number }[] = [];
    const maxTrailLength = 1000; // limit trail length for performance


    let theta = 0; // inner angle
    const dTheta = 0.05; // angular step per tick (increased for faster rotation)

    // Resize handler: update canvas size, center, L, and current rod positions
    const handleResize = () => {
      const size = getSize();
      width = size.width;
      height = size.height;

      render.options.width = width;
      render.options.height = height;
      render.canvas.width = width;
      render.canvas.height = height;

      center = { x: width / 2, y: height / 2 };
      L = Math.min(width, height) * 0.15;

      // Reposition rods immediately to avoid jump on next tick
      const x1 = center.x + L * Math.cos(theta);
      const y1 = center.y + L * Math.sin(theta);
      Body.setAngle(rod1, theta);
      Body.setPosition(rod1, {
        x: center.x + (L / 2) * Math.cos(theta),
        y: center.y + (L / 2) * Math.sin(theta),
      });
      const phi = Math.PI * theta;
      Body.setAngle(rod2, phi);
      Body.setPosition(rod2, {
        x: x1 + (L / 2) * Math.cos(phi),
        y: y1 + (L / 2) * Math.sin(phi),
      });

      // Clear trail to avoid distorted scaling after resize
      trail.length = 0;
    };

    // Setup initial sizing in case container changed after mount
    handleResize();
    window.addEventListener('resize', handleResize);

    // Update rods' poses before each physics step
    Events.on(engine, 'beforeUpdate', () => {
      // Inner rod absolute angle = theta
      const x1 = center.x + L * Math.cos(theta);
      const y1 = center.y + L * Math.sin(theta);
      Body.setAngle(rod1, theta);
      Body.setPosition(rod1, {
        x: center.x + (L / 2) * Math.cos(theta),
        y: center.y + (L / 2) * Math.sin(theta),
      });

      // Outer rod absolute angle = pi * theta (faster)
      const phi = Math.PI * theta;
      Body.setAngle(rod2, phi);
      Body.setPosition(rod2, {
        x: x1 + (L / 2) * Math.cos(phi),
        y: y1 + (L / 2) * Math.sin(phi),
      });

      // Endpoint of outer rod
      const x2 = x1 + L * Math.cos(phi);
      const y2 = y1 + L * Math.sin(phi);
      trail.push({ x: x2, y: y2 });
      
      // Limit trail length for performance
      if (trail.length > maxTrailLength) {
        trail.shift(); // Remove oldest point
      }

      theta += dTheta;
    });

    // Custom drawing after bodies are rendered
    Events.on(render, 'afterRender', () => {
      const ctx = render.context;

      // Draw trail
      if (trail.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Draw first 10 points with different color
        if (trail.length > 10) {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const p = trail[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = '#00ff00'; // Green for starting trail
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Draw remaining trail with original color
        ctx.beginPath();
        const startIdx = Math.min(9, trail.length - 1);
        for (let i = startIdx; i < trail.length; i++) {
          const p = trail[i];
          if (i === startIdx) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = '#ff00ee';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Draw joints as circles for clarity
      const x1 = center.x + L * Math.cos(theta);
      const y1 = center.y + L * Math.sin(theta);
      const phi = Math.PI * theta;
      const x2 = x1 + L * Math.cos(phi);
      const y2 = y1 + L * Math.sin(phi);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x1, y1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Cleanup
    return () => {
  Render.stop(render);
  Runner.stop(runner);
  const canvas = render.canvas;
  canvas.remove();
  (render as any).textures = {};
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100vw', 
      height: '100vh',
      boxSizing: 'border-box', 
      padding: '20px',
      gap: '20px'
    }}>
      <h2 style={{ color: '#fff', fontFamily: 'system-ui', margin: 0, textAlign: 'center' }}>
        Two rods: e^(iθ) + e^(iπθ) with Matter.js
      </h2>
      <div
        ref={sceneRef}
        style={{
          width: '100%',
          maxWidth: '60vh',
          maxHeight: '60vh',
          aspectRatio: '1',
          border: '2px solid #222',
          background: '#181818',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
      <p style={{ color: '#ddd', maxWidth: '600px', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>
        Inner rod angle θ; outer rod angle πθ. The endpoint trace never closes exactly because π is irrational.
        Watch the near-closures at good rational approximations like 22/7 and 355/113.
      </p>
    </div>
  );
}

export default App;
