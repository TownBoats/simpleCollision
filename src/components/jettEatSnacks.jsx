import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

const JettEatSnacks = () => {
  const { Engine, Render, Runner, Bodies, Body, Composite } = Matter;
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  const nside = 40;
  const radius = height*0.4;
  const thickness = 7;
  const x = width / 2;
  const y = height / 2;
  const canvasRef = useRef(null);

  useEffect(() => {
    // 创建引擎、渲染器、运行器
    const engine = Engine.create();
    const render = Render.create({
      element: canvasRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#000000',
      }
    });
    const runner = Runner.create();

    // 绘制圆环
    let sides = [];
    const rectWidth = 2 * radius * Math.sin(Math.PI / nside);

    for (let i = 0; i < nside; i++) {
      const angle = (2 * Math.PI / nside) * i;
      const angleNext = angle + (2 * Math.PI / nside);

      const x1 = x + radius * Math.cos(angle);
      const y1 = y + radius * Math.sin(angle);
      const x2 = x + radius * Math.cos(angleNext);
      const y2 = y + radius * Math.sin(angleNext);

      const xMid = (x1 + x2) / 2;
      const yMid = (y1 + y2) / 2;

      const rectangle = Bodies.rectangle(xMid, yMid, rectWidth, thickness, {
        isStatic: true,
        render: {
          fillStyle: '#3498db'
        }
      });

      Body.setAngle(rectangle, Math.atan2(y2 - y1, x2 - x1));
      sides.push(rectangle);
    }

    Composite.add(engine.world, sides);

    // 启动引擎和运行器
    Render.run(render);
    Runner.run(runner, engine);

    // 组件卸载时清理
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [nside]); // 依赖于 nside，允许重新绘制圆环

  return <div ref={canvasRef}></div>;
};

export default JettEatSnacks;
