import React, { useEffect } from 'react';
import Matter from 'matter-js';
const LearnMatterJs = () => {
    //创建引擎
    const Engine = Matter.Engine;
    let engine = Engine.create();
    let engine2 = Engine.create();
    //创建渲染器
    const Render = Matter.Render;

    //创建刚体
    const Bodies = Matter.Bodies;
    let boxA = Bodies.rectangle(400, 150, 50, 50);
    let boxB = Bodies.rectangle(450, 50, 80, 80,{render:{fillStyle: 'red'}});
    let ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

    let circleA = Bodies.circle(400, 100, 30);
    let circleB = Bodies.circle(450, 100, 30);

    //创建复合体  
    const Composite = Matter.Composite;
    //创建渲染器
    const Runner = Matter.Runner;

    
    useEffect(() => {
        //将引擎和渲染器关联起来，绑定网页dom元素
        let render = Render.create({
            element: document.getElementById('canvas'),
            engine: engine,
            options: {
                wireframes: false
              }
        })

        let render2 = Render.create({
            element: document.getElementById('canvas'),
            engine: engine2,
        })
        //组合复合体
        Composite.add(engine.world, [boxA, boxB, ground]);
        Composite.add(engine2.world, [circleA, circleB, ground]);
        //运行渲染器
        Render.run(render);
        // Render.run(render2);
        var runner = Runner.create();
        Runner.run(runner, engine);
        // Runner.run(runner, engine2);
    }, [])


    return (
        <div>
            <div> hello matterjs</div>
            <div id="canvas"></div>
            {/* <div id="canvas2"></div> */}
        </div>

    );
};

export default LearnMatterJs;
