import React,{useEffect} from 'react';
import Matter from 'matter-js';

const InnerPolygon = () => {

    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Composite = Matter.Composite;

    let engine = Engine.create();
    let n = 4; // number of sides
    let thickNess = 10; // thickness of the polygon
    let radius = 350; // radius of the polygon
    let x = 400; // x-coordinate of the polygon
    let y = 400; // y-coordinate of the polygon
    let rectangles =[];

    useEffect(() => {
        let render = Render.create({
            element: document.getElementById('canvas'),
            engine: engine,
            options: {
                width: 1000, 
                height: 1000,
                wireframes: false,
                background: '#000000',
            }
        });
        let rectWidth = 2 * radius * Math.sin((2*Math.PI) / n/2);
        for (let i = 0; i < n; i++) {
            // 计算两个连续顶点的坐标
            const angle1 = (2 * Math.PI / n) * i;
            const angle2 = (2 * Math.PI / n) * (i + 1);

            const x1 = x + radius * Math.cos(angle1);
            const y1 = y + radius * Math.sin(angle1);
            const x2 = x + radius * Math.cos(angle2);
            const y2 = y + radius * Math.sin(angle2);

            // 计算矩形的中心点坐标
            const xmid = (x1 + x2) / 2;
            const ymid = (y1 + y2) / 2;

            // // 计算矩形的宽度（两点之间的距离）
            // const rectWidth = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

            // 矩形的厚度
            const rectThickness = thickNess;

            // 创建和放置矩形
            const rectangle = Bodies.rectangle(xmid, ymid, rectWidth, rectThickness, {
                isStatic: true,
                render: {
                    fillStyle: '#3498db'
                }
            });

            // 设置矩形的角度
            const rectAngle = Math.atan2(y2 - y1, x2 - x1);
            Body.setAngle(rectangle, rectAngle);

            // 将矩形加入到数组中
            rectangles.push(rectangle);
            Composite.add(engine.world, rectangle);
            Render.run(render);
            let runner = Runner.create();
            Runner.run(engine, runner);
        };
        
    },[])

  return (
    <div>
      <div id="canvas"></div>
    </div>
  );
}

export default InnerPolygon;