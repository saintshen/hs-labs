import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "HS Labs" },
    { name: "description", content: "Welcome to HS Labs!" },
  ];
};


import { useEffect, useRef } from "react";

export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<{x:number, y:number}|null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    canvas.height = height;
    let particles: {x:number, y:number, vx:number, vy:number, r:number, color:string}[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: 2 + Math.random() * 3,
        color: `hsl(${Math.random()*360},80%,60%)`
      });
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      // draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          let p1 = particles[i], p2 = particles[j];
          let dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(180,180,255,${1-dist/100})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      // 鼠标与粒子连线
      if (mouse.current) {
        for (let p of particles) {
          let dist = Math.hypot(p.x - mouse.current.x, p.y - mouse.current.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.current.x, mouse.current.y);
            ctx.strokeStyle = `rgba(255,120,200,${1-dist/120})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        // 鼠标点
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, 8, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,120,200,0.3)";
        ctx.fill();
      }
    }
    function update() {
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        // 鼠标吸引效果
        if (mouse.current) {
          let dx = mouse.current.x - p.x;
          let dy = mouse.current.y - p.y;
          let dist = Math.hypot(dx, dy);
          if (dist < 120) {
            p.vx += dx/dist*0.05;
            p.vy += dy/dist*0.05;
            // 限制速度
            p.vx = Math.max(Math.min(p.vx,2),-2);
            p.vy = Math.max(Math.min(p.vy,2),-2);
          }
        }
      }
    }
    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    loop();
    // resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    // 鼠标事件
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouse.current = null;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0" style={{width: "100vw", height: "100vh", overflow: "hidden"}}>
      <canvas
        ref={canvasRef}
        style={{position: "absolute", top:0, left:0, width: "100vw", height: "100vh", display: "block"}}
      />
    </div>
  );
}
