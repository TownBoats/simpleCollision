import React, { useEffect } from 'react';
import Matter from 'matter-js';
const LearnConstraint = () => {
    //创建引擎
    const Engine = Matter.Engine;
    let engine = Engine.create();
    //创建渲染器
    const Render = Matter.Render;

    //创建刚体
    const Bodies = Matter.Bodies;
    let board = Bodies.rectangle(400, 410, 20, 100, {
        render: { fillStyle: 'blue' },
        collisionFilter: {  
            group: -1
        }
    });
    let stone = Bodies.rectangle(400, 410, 300, 20, { 
        render: { fillStyle: 'red' },
        collisionFilter: {
            group: -1
        }});
    let ground = Bodies.rectangle(400, 490, 810, 60, { isStatic: true });
    let constraint = Matter.Constraint.create({
        bodyA: board,
        bodyB: stone,
        length:0
    })

    let boxA = Bodies.rectangle(300, 200, 80, 80,{mass:1});
    let boxB = Bodies.rectangle(500, 200, 40, 40,{mass:2});
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

        //组合复合体
        Composite.add(engine.world, [constraint,stone,board,boxA,boxB, ground]);
        //运行渲染器
        Render.run(render);
        var runner = Runner.create();
        Runner.run(runner, engine);
    }, [])

    return (
        <div>
            <div id="canvas"></div>
            {/* <div id="canvas2"></div> */}
        </div>

    );
};

export default LearnConstraint;
