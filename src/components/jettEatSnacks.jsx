import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Howl } from "howler";

const JettEatSnacks = () => {
    const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Game state
    const [gameStarted, setGameStarted] = useState(false);

    // Circle properties
    const nside = 100;
    const radius = height * 0.4;
    const thickness = 10;
    const x = width / 2;
    const y = height / 2;
    const rectWidth = 2 * radius * Math.sin(Math.PI / nside) + 1;
    let sides = [];

    // jettBall properties
    const jettBallRadius = radius * 0.1;

    // snack properties
    const snackRadius = jettBallRadius * 0.7;

    // Audio
    const collisionSound = useRef(null);

    function getSnackPath() {
        const paths = [
            process.env.PUBLIC_URL + '/images/snack/StrawberryCake.png',
            process.env.PUBLIC_URL + '/images/snack/colo.png',
            process.env.PUBLIC_URL + '/images/snack/可乐.png',
            process.env.PUBLIC_URL + '/images/snack/fried-chicken.png',
            process.env.PUBLIC_URL + '/images/snack/sushi.png',
        ];
        let randomIndex = Math.floor(Math.random() * paths.length);
        return paths[randomIndex];
    }

    function createJettBall() {
        const jettBall = Bodies.circle(x, y, jettBallRadius, {
            friction: 0,
            frictionAir: 0,
            restitution: 1,
            mass: 0.1,
            label: 'jettBall',
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002 | 0x0004,
            },
        });

        const jettImage = new Image();
        jettImage.src = process.env.PUBLIC_URL + '/images/character/jett/jett2-head.png';
        const randomSpeed = 5;
        const randomAngle = Math.random() * 2 * Math.PI;
        configureSprite(jettBall, jettImage, jettBallRadius);
        Matter.Body.setVelocity(jettBall, {
            x: randomSpeed * Math.cos(randomAngle),
            y: randomSpeed * Math.sin(randomAngle),
        });
        return jettBall;
    }

    function createSnack() {
        const randomX = (Math.random() * 2 - 1) * radius / 2;
        const randomY = (Math.random() * 2 - 1) * radius / 2;

        const snack = Bodies.circle(x + randomX, y + randomY, snackRadius, {
            friction: 0,
            frictionAir: 0,
            restitution: 1,
            mass: 0.1,
            label: 'snack',
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001 | 0x0004 | 0x0002,
            },
        });
        const snackImage = new Image();
        snackImage.src = getSnackPath();
        configureSprite(snack, snackImage, snackRadius);
        const randomSpeed = 5;
        const randomAngle = Math.random() * 2 * Math.PI;
        Matter.Body.setVelocity(snack, {
            x: randomSpeed * Math.cos(randomAngle),
            y: randomSpeed * Math.sin(randomAngle),
        });

        return snack;
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
                mass: 0,
                collisionFilter: {
                    category: 0x0004,
                    mask: 0x0001 | 0x0002,
                },
                render: {
                    fillStyle: '#3498db',
                },
            });

            Body.setAngle(rectangle, Math.atan2(y2 - y1, x2 - x1));
            sides.push(rectangle);
        }
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

    function addSnackBall() {
        const snack = createSnack();
        Composite.add(engineRef.current.world, snack);
    }

    const playCollisionSound = () => {
        if (collisionSound.current) {
            collisionSound.current.play();
        }
    };

    useEffect(() => {
        if (!gameStarted) return; // Do not initialize until the game has started

        // Initialize audio after user interaction
        collisionSound.current = new Howl({
            src: [process.env.PUBLIC_URL + '/sounds/collision.wav'],
            volume: 0.6,
            onload: () => {
                console.log('Audio loaded');
            },
        });

        initialWorld();

        // Cleanup on component unmount
        return () => {
            if (engineRef.current) {
                Matter.Render.stop(engineRef.current.render);
                Matter.Runner.stop(engineRef.current.runner);
                engineRef.current.world.bodies = [];
                Matter.Engine.clear(engineRef.current);
                engineRef.current.render.canvas.remove();
                engineRef.current.render.textures = {};
                engineRef.current = null;
            }
            if (collisionSound.current) {
                collisionSound.current.unload();
                collisionSound.current = null;
            }
        };
    }, [gameStarted]);

    function initialWorld() {
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
            },
        });
        engine.render = render;

        const runner = Runner.create();
        engine.runner = runner;

        const jettBall = createJettBall();
        const snack = createSnack();
        const ring = createRing();
        Composite.add(engine.world, [jettBall, snack, ...ring]);

        // Start engine and runner
        Render.run(render);
        Runner.run(runner, engine);

        const handleCollision = (event) => {
            var pairs = event.pairs;
            pairs.forEach(function (pair) {
                const { bodyA, bodyB } = pair;
                if (
                    (bodyA.label === 'jettBall' && bodyB.label === 'snack') ||
                    (bodyA.label === 'snack' && bodyB.label === 'jettBall')
                ) {
                    const snackBall = bodyA.label === 'snack' ? bodyA : bodyB;
                    Composite.remove(engineRef.current.world, snackBall);
                    playCollisionSound();
                    pair.isActive = false;
                    addSnackBall();
                    addSnackBall();
                }
            });
        };

        Events.on(engineRef.current, 'collisionStart', handleCollision);
    }

    return (
        <div ref={canvasRef} style={{ position: 'relative' }}>
            {!gameStarted && (
                <button
                    onClick={() => setGameStarted(true)}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        padding: '15px 30px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        outline: 'none',
                    }}
                >
                    Start Game
                </button>
            )}
        </div>
    );
};

export default JettEatSnacks;
