import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Howl } from "howler";

const JettEatSnacks = () => {
    const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter;
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const width = window.innerWidth;
    const height = window.innerHeight;
    let snackCount = 1;

    // Game state
    const [gameStarted, setGameStarted] = useState(false);

    // **Add state variables for snack counts**
    const [eatenSnacks, setEatenSnacks] = useState(0); // Jett has eaten
    const [currentSnacks, setCurrentSnacks] = useState(1); // Snacks in the world

    // Circle properties
    const nside = 100;
    const radius = height * 0.4;
    const thickness = 10;
    const x = width / 2;
    const y = height / 2;
    const rectWidth = 2 * radius * Math.sin(Math.PI / nside) + 1;
    const maxSpeed = 15;
    const minSpeed = 5;
    let sides = [];

    // jettBall properties
    const jettBallRadius = radius * 0.1;

    // snack properties
    const snackRadius = jettBallRadius * 0.7;

    // Audio
    const collisionSound = useRef(null);
    const killSounds = useRef(null);


    function createNumSnack(n) {
        for (let i = 0; i < n; i++) {
            addSnackBall();
        }
    }

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
        jettImage.src = process.env.PUBLIC_URL + '/images/character/jett/jett1-head2.png';
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
        // 计算生成区域的半径，即 radius - snackRadius
        const randomRadius = (Math.random() * (radius - snackRadius));

        // 随机生成角度，以便生成 x 和 y 偏移量
        const randomAngle = Math.random() * 2 * Math.PI;

        // 通过极坐标转换为笛卡尔坐标
        const randomX = randomRadius * Math.cos(randomAngle);
        const randomY = randomRadius * Math.sin(randomAngle);

        const snack = Bodies.circle(x + randomX, y + randomY, snackRadius, {
            friction: 0,
            frictionAir: 0,
            restitution: 1,
            mass: 0.1,
            label: 'snack',
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001 | 0x0004,
            },
        });
        const snackImage = new Image();
        snackImage.src = getSnackPath();
        configureSprite(snack, snackImage, snackRadius);
        const randomSpeed = 5;
        // const randomAngle = Math.random() * 2 * Math.PI;
        Matter.Body.setVelocity(snack, {
            x: randomSpeed * Math.cos(randomAngle),
            y: randomSpeed * Math.sin(randomAngle),
        });

        return snack;
    }

    function createExplosion(x, y, numParticles = 5) {
        const particles = [];
        for (let i = 0; i < numParticles; i++) {
            const particleRadius = Math.random() * 5 + 2; // Randomize particle radius
            const particle = Bodies.circle(x, y, particleRadius, {
                friction: 0,
                frictionAir: 0.02, // Slow down particles over time
                restitution: 0.8,
                render: {
                    fillStyle: `hsl(${Math.random() * 360}, 100%, 70%, 0.8)`, // Random color
                    // fillStyle: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`, // Random color with 50% transparency

                },
                collisionFilter: {
                    category: 0x0008, // Separate category to avoid collisions
                },
            });

            // Assign random velocity
            const speed = Math.random() * 5 + 2;
            const angle = Math.random() * Math.PI * 2;
            Body.setVelocity(particle, {
                x: speed * Math.cos(angle),
                y: speed * Math.sin(angle),
            });

            particles.push(particle);
        }

        // Add particles to the world
        Composite.add(engineRef.current.world, particles);

        // Remove particles after a short time
        setTimeout(() => {
            particles.forEach(particle => {
                Composite.remove(engineRef.current.world, particle);
            });
        }, 500);
    }

    function createFlashEffect(x, y) {
        const flash = Bodies.circle(x, y, 50, {
            isStatic: true, // 不受物理影响
            render: {
                fillStyle: 'rgba(255, 255, 255, 0.5)', // 半透明白色
            },
        });
    
        Composite.add(engineRef.current.world, flash);
    
        // 渐隐消失
        setTimeout(() => {
            flash.render.fillStyle = 'rgba(255, 255, 255, 0)'; // 渐隐
            Matter.World.remove(engineRef.current.world, flash);
        }, 200); // 200毫秒后移除闪光
    }

    function removeEntitiesByLabel(world, label) {
        const bodiesToRemove = world.bodies.filter(body => body.label === label);
        bodiesToRemove.forEach(body => {
            Matter.World.remove(world, body);
            createExplosion(body.position.x, body.position.y,1);
            // createFlashEffect(body.position.x, body.position.y);
        });
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
        snackCount++;
        Composite.add(engineRef.current.world, snack);

        // **Increment current snacks count**
        setCurrentSnacks(prevCount => prevCount + 1);
    }

    const playCollisionSound = () => {
        if (collisionSound.current) {
            collisionSound.current.play();
        }
    };

    const preloadSounds = () => {
        return {
            killSound1: new Howl({
                src: [process.env.PUBLIC_URL + '/sounds/瓦/kill-sound/普通击杀音效/valorant-1-kill.mp3'],
                volume: 1,
                preload: true, // 提前加载音频
            }),
            killSound2: new Howl({
                src: [process.env.PUBLIC_URL + '/sounds/瓦/kill-sound/普通击杀音效/valorant-2-kills.mp3'],
                volume: 1,
                preload: true,
            }),
            killSound3: new Howl({
                src: [process.env.PUBLIC_URL + '/sounds/瓦/kill-sound/普通击杀音效/valorant-3-kills.mp3'],
                volume: 1,
                preload: true,
            }),
            killSound4: new Howl({
                src: [process.env.PUBLIC_URL + '/sounds/瓦/kill-sound/普通击杀音效/valorant-4-kills.mp3'],
                volume: 1,
                preload: true,
            }),
            killSound5: new Howl({
                src: [process.env.PUBLIC_URL + '/sounds/瓦/kill-sound/普通击杀音效/valorant-5-kills.mp3'],
                volume: 1,
                preload: true,
            }),
        };
    };

    const playKillSound = (counts) => {
        console.log('counts' + counts);
        if (counts === 5) {

            killSounds.current.killSound1.play();
        } else if (counts === 25) {

            console.log('kill sound2 played');
            killSounds.current.killSound2.play();
        } else if (counts === 125) {

            killSounds.current.killSound3.play();

        } else if (counts === 625) {
            killSounds.current.killSound4.play();

        } else if (counts === 3125) {
            killSounds.current.killSound5.play();

        }

    };

    const loadKillSound = () => {
        killSounds.current = preloadSounds();
    };
    useEffect(() => {
        if (!gameStarted) return; // Do not initialize until the game has started

        // Initialize audio after user interaction
        collisionSound.current = new Howl({
            src: [process.env.PUBLIC_URL + '/sounds/collision.wav'],
            volume: 0.1,
        });
        loadKillSound();
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
        createNumSnack(1000);
        // Start engine and runner
        Render.run(render);
        Runner.run(runner, engine);

        const handleCollision = (event) => {
            var pairs = event.pairs;
            pairs.forEach(function (pair) {
                const { bodyA, bodyB } = pair;

                // Check for collision between jettBall and snack
                if (
                    (bodyA.label === 'jettBall' && bodyB.label === 'snack') ||
                    (bodyA.label === 'snack' && bodyB.label === 'jettBall')
                ) {
                    // Identify the snackBall
                    const snackBall = bodyA.label === 'snack' ? bodyA : bodyB;

                    // Remove snackBall and create explosion
                    Composite.remove(engineRef.current.world, snackBall);
                    createExplosion(snackBall.position.x, snackBall.position.y);
                    playCollisionSound();
                    pair.isActive = false;

                    // **Update snack counts**
                    setEatenSnacks(prevCount => {
                        const newCount = prevCount + 1;
                        const isTrue = (newCount === 5 || newCount === 25 || newCount === 125 || newCount === 625 || newCount === 3125);
                        if (isTrue) {
                            playKillSound(newCount);
                        }
                        if (newCount === 3150)
                            removeEntitiesByLabel(engineRef.current.world, 'snack')
                        return newCount;
                    }); // Increment eaten snacks
                    setCurrentSnacks(prevCount => prevCount - 1); // Decrement current snacks

                    // Get jettBall
                    const jettBall = bodyA.label === 'jettBall' ? bodyA : bodyB;

                    // Increase jettBall speed by 0.5%
                    const currentVelocity = jettBall.velocity;
                    const currentSpeed = Math.sqrt(currentVelocity.x ** 2 + currentVelocity.y ** 2);
                    if (currentSpeed < maxSpeed) {
                        const newVelocity = {
                            x: currentVelocity.x * 1.005,
                            y: currentVelocity.y * 1.005,
                        };
                        Matter.Body.setVelocity(jettBall, newVelocity);
                    }
                    // Increase jettBall radius by 1px
                    const currentRadius = jettBall.circleRadius;
                    const scaleFactor = (currentRadius + 0.08) / currentRadius;
                    Matter.Body.scale(jettBall, scaleFactor, scaleFactor);
                    const jettImage = new Image();
                    jettImage.src = process.env.PUBLIC_URL + '/images/character/jett/jett1-head2.png';
                    configureSprite(jettBall, jettImage, currentRadius + 1);

                    // Add new snacks
                    if (snackCount <= 1000) {
                        addSnackBall();
                        addSnackBall();
                    }

                    snackCount--;
                }
            });
        };

        Events.on(engineRef.current, 'collisionStart', handleCollision);
    }


    return (
        <div ref={canvasRef} style={{ position: 'relative' }}>
            {gameStarted && (
                // **Display the counts**
                <div
                    style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        color: 'white',
                        zIndex: 1,
                        fontSize: '18px',
                        fontFamily: 'Arial, sans-serif',
                    }}
                >
                    <p>Snacks eaten: {eatenSnacks}</p>
                    <p>Snacks in world: {currentSnacks}</p>
                </div>
            )}
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
