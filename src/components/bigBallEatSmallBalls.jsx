import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

function BigBallEatSmallBalls() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const circleRadius = Math.min(width, height) * 0.5;
    const wallThickness = 5;
    const numSides = 1000;
    const gapSize = 100;
    const ballRadius = circleRadius * 0.03;
    const hunterBallRadius = ballRadius * 2;
    const trailDuration = 300;
    const maxSpeed = 15;
    const minSpeed = 2;
    const balls = [];
    let hunterBall;
    let rotationAngle = 0;
    const trails = {};

    const engine = Matter.Engine.create();
    const world = engine.world;
    engine.gravity.y = 0;

    const ballCategory = 0x0001;
    const ringCategory = 0x0002;
    const hunterCategory = 0x0004;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#1a1a1a',
      },
    });

    const angleStep = (2 * Math.PI) / numSides;
    const ringBodies = [];

    function createRing() {
      const startGapIndex = Math.floor(numSides / 2 - gapSize / 2);
      const endGapIndex = Math.floor(numSides / 2 + gapSize / 2);

      for (let i = 0; i < numSides; i++) {
        if (i >= startGapIndex && i <= endGapIndex) continue;

        const angle = i * angleStep + rotationAngle;
        const xPos = width / 2 + circleRadius * Math.cos(angle);
        const yPos = height / 2 + circleRadius * Math.sin(angle);

        const rect = Matter.Bodies.rectangle(xPos, yPos, 2 * Math.PI * circleRadius / numSides, wallThickness, {
          isStatic: true,
          angle: angle,
          collisionFilter: {
            category: ringCategory,
            mask: ballCategory | hunterCategory,
          },
          render: {
            fillStyle: '#f2f2f2',
          },
        });

        ringBodies.push(rect);
      }

      Matter.World.add(world, ringBodies);
    }

    function createBall(x = width / 2, y = height / 2 - 100) {
      const ball = Matter.Bodies.circle(x, y, ballRadius, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        inertia: Infinity,
        collisionFilter: {
          category: ballCategory,
          mask: ringCategory | hunterCategory,
        },
        render: {
          fillStyle: '#ff9900',
        },
      });

      const randomSpeed = 10;
      const randomAngle = Math.random() * 2 * Math.PI;
      Matter.Body.setVelocity(ball, {
        x: randomSpeed * Math.cos(randomAngle),
        y: randomSpeed * Math.sin(randomAngle),
      });

      balls.push(ball);
      trails[ball.id] = [];
      Matter.World.add(world, ball);
    }

    function createHunterBall() {
      hunterBall = Matter.Bodies.circle(width / 2, height / 2 - 150, hunterBallRadius, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        inertia: Infinity,
        collisionFilter: {
          category: hunterCategory,
          mask: ringCategory | ballCategory,
        },
        render: {
          fillStyle: '#00ff00',
        },
      });

      const randomSpeed = 8;
      const randomAngle = Math.random() * 2 * Math.PI;
      Matter.Body.setVelocity(hunterBall, {
        x: randomSpeed * Math.cos(randomAngle),
        y: randomSpeed * Math.sin(randomAngle),
      });

      trails[hunterBall.id] = [];
      Matter.World.add(world, hunterBall);
    }

    createBall();
    createHunterBall();
    createRing();

    Matter.Render.run(render);

    // 使用自定义的引擎更新循环
    const update = () => {
      Matter.Engine.update(engine, 1000 / 60); // 手动更新物理引擎，每秒60帧
      requestAnimationFrame(update); // 递归调用，保持循环
    };

    update(); // 启动更新循环

    function limitSpeed(velocity) {
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      if (speed > maxSpeed) {
        return {
          x: (velocity.x / speed) * maxSpeed,
          y: (velocity.y / speed) * maxSpeed,
        };
      } else if (speed < minSpeed) {
        return {
          x: (velocity.x / speed) * minSpeed,
          y: (velocity.y / speed) * minSpeed,
        };
      }
      return velocity;
    }

    Matter.Events.on(engine, 'afterUpdate', function () {
      const currentTime = Date.now();

      balls.forEach(function (ball, index) {
        const velocity = ball.velocity;
        const limitedVelocity = limitSpeed(velocity);
        Matter.Body.setVelocity(ball, limitedVelocity);

        trails[ball.id].push({ x: ball.position.x, y: ball.position.y, time: currentTime });

        trails[ball.id] = trails[ball.id].filter(trail => currentTime - trail.time <= trailDuration);

        const distanceFromCenter = Math.sqrt(Math.pow(ball.position.x - width / 2, 2) + Math.pow(ball.position.y - height / 2, 2));
        if (distanceFromCenter > circleRadius + ballRadius) {
          for (let i = 0; i < 3; i++) {
            const randomAngle = Math.random() * 2 * Math.PI;
            const randomDistance = Math.random() * circleRadius * 0.8;
            const newX = width / 2 + randomDistance * Math.cos(randomAngle);
            const newY = height / 2 + randomDistance * Math.sin(randomAngle);
            createBall(newX, newY);
          }

          Matter.World.remove(world, ball);
          balls.splice(index, 1);
          delete trails[ball.id];
        }
      });

      const hunterVelocity = hunterBall.velocity;
      Matter.Body.setVelocity(hunterBall, limitSpeed(hunterVelocity));

      const distanceFromCenterHunter = Math.sqrt(Math.pow(hunterBall.position.x - width / 2, 2) + Math.pow(hunterBall.position.y - height / 2, 2));
      if (distanceFromCenterHunter > circleRadius + hunterBall.circleRadius) {
        const randomAngle = Math.random() * 2 * Math.PI;
        const randomDistance = Math.random() * circleRadius * 0.8;
        const newX = width / 2 + randomDistance * Math.cos(randomAngle);
        const newY = height / 2 + randomDistance * Math.sin(randomAngle);
        Matter.Body.setPosition(hunterBall, { x: newX, y: newY });
      }

      rotationAngle += 0.01;

      Matter.World.remove(world, ringBodies);
      ringBodies.length = 0;

      createRing();
    });

    Matter.Events.on(engine, 'collisionStart', function(event) {
      event.pairs.forEach(function (pair) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if ((bodyA === hunterBall && balls.includes(bodyB)) || (bodyB === hunterBall && balls.includes(bodyA))) {
          const preyBall = bodyA === hunterBall ? bodyB : bodyA;

          const newRadius = hunterBall.circleRadius * 1.01;
          Matter.Body.scale(hunterBall, newRadius / hunterBall.circleRadius, newRadius / hunterBall.circleRadius);
          hunterBall.circleRadius = newRadius;

          for (let i = 0; i < 3; i++) {
            const randomAngle = Math.random() * 2 * Math.PI;
            const randomDistance = Math.random() * circleRadius * 0.8;
            const newX = width / 2 + randomDistance * Math.cos(randomAngle);
            const newY = height / 2 + randomDistance * Math.sin(randomAngle);
            createBall(newX, newY);
          }

          Matter.World.remove(world, preyBall);
          const preyIndex = balls.indexOf(preyBall);
          if (preyIndex > -1) {
            balls.splice(preyIndex, 1);
          }

        //   const collisionSound = new Audio('collision.mp3');
        const collisionSound = new Audio(process.env.PUBLIC_URL + '/collision.mp3');
          collisionSound.play();
        }
      });
    });

    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
      Matter.World.clear(world, false);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

export default BigBallEatSmallBalls;
