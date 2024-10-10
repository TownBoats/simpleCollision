import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

const JettEatSnacks = () => {
    const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    //圆环属性
    const nside = 100;
    const radius = height * 0.4;
    const thickness = 3;
    const x = width / 2;
    const y = height / 2;
    const rectWidth = 2 * radius * Math.sin(Math.PI / nside) + 1;
    let sides = [];
    //jett球的属性
    const jettBallRadius = radius * 0.08;
    const maxSpeed = 10;
    const minSpeed = 5;
    //food的属性
    const foodRadius = jettBallRadius * 0.8;



    function createJettBall() {
        const jettBall = Bodies.circle(x, y, jettBallRadius, {
            friction: 0,
            frictionAir: 0,
            restitution: 1,
            mass: 0.1, // 设定较大的质量
            label: 'jettBall',
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002 | 0x0004, // 与 food 触发碰撞事件，与 ring 发生物理碰撞
            },
        });

        const jettImage = new Image();
        jettImage.src = process.env.PUBLIC_URL + '/images/character/jett/jett.png';
        const randomSpeed = 5;
        const randomAngle = Math.random() * 2 * Math.PI;
        configureSprite(jettBall, jettImage, jettBallRadius);
        Matter.Body.setVelocity(jettBall, {
            x: randomSpeed * Math.cos(randomAngle),
            y: randomSpeed * Math.sin(randomAngle),
        });
        return jettBall;
    }
    function createFood() {
        const food = Bodies.circle(x, y, foodRadius, {
            friction: 0,
            frictionAir: 0,
            restitution: 1,
            mass: 0.1, // 设定较小的质量
            label: 'food',
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001 | 0x0004, //  与 jettBall 和 ring 发生碰撞
            },
            // isSensor: true, // 确保不产生物理影响
        });
        const foodImage = new Image();
        foodImage.src = process.env.PUBLIC_URL + '/images/food/StrawberryCake.png';  // 替换为你的图片路径
        configureSprite(food, foodImage, foodRadius);
        const randomSpeed = 5;
        const randomAngle = Math.random() * 2 * Math.PI;
        Matter.Body.setVelocity(food, {
            x: randomSpeed * Math.cos(randomAngle),
            y: randomSpeed * Math.sin(randomAngle),
        });


        return food;
    }

    function createRing() {
        sides = [];
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
                label: 'ring',
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002, // 与 jettBall 和 food 发生物理碰撞
                },
                render: {
                    fillStyle: '#3498db'
                }
            });

            Body.setAngle(rectangle, Math.atan2(y2 - y1, x2 - x1));
            sides.push(rectangle);
        }
        console.log("sides:", sides);
        return sides;
    }
    function configureSprite(circle, img, radius) {
        img.onload = () => {
            const imageWidth = img.width;
            const imageHeight = img.height;
            const scaleFactor = (2 * radius) / Math.min(imageWidth, imageHeight);

            circle.render.sprite.texture = img.src;
            circle.render.sprite.xScale = scaleFactor;
            circle.render.sprite.yScale = scaleFactor;
        };
    }

    function addFoodBall() {
        const food = createFood();
        Composite.add(engineRef.current.world, food);
    }

    useEffect(() => {
        // 创建引擎、渲染器、运行器
        const engine = Engine.create();
        engine.gravity.y = 0.5;
        engineRef.current = engine;
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
        const jettBall = createJettBall();
        const food = createFood();
        food.render.sprite.texture = process.env.PUBLIC_URL + '/images/food/StrawberryCake.png';
        const ring = createRing();
        // Composite.add(engine.world, createRing());
        Composite.add(engine.world, [jettBall, food, ...ring]);

        // 启动引擎和运行器
        Render.run(render);
        Runner.run(runner, engine);

        const handleCollision = (event) => {
            var pairs = event.pairs;
            pairs.forEach(function (pair) {
                const { bodyA, bodyB } = pair;
                if (
                    (bodyA.label === 'jettBall' && bodyB.label === 'food') ||
                    (bodyA.label === 'food' && bodyB.label === 'jettBall')
                ) {
                    console.log('碰');
                    const foodBall = bodyA.label === 'food' ? bodyA : bodyB;
                    Composite.remove(engineRef.current.world, foodBall);

                    //禁止物理碰撞
                    // pair.activeContacts = [];
                    pair.isActive = false
                }
            });
        };

        Events.on(engineRef.current, 'collisionStart', handleCollision);

        // 组件卸载时清理
        return () => {
            Events.off(engineRef.current, 'collisionStart', handleCollision);
            Render.stop(render);
            Runner.stop(runner);
            Composite.clear(engine.world);
            Engine.clear(engine);
            render.canvas.remove();
            render.textures = {};
        };
    }, [nside]); // 依赖于 nside，允许重新绘制圆环

    return <div ref={canvasRef}>
        <button onClick={addFoodBall} style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
            Add Food
        </button>
    </div>;
};

export default JettEatSnacks;
