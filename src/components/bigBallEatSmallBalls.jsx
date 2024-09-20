import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

function BigBallEatSmallBalls() {
  const canvasRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false); // 新增暂停状态
  const [isGameOver, setIsGameOver] = useState(false); // 新增终止状态

  useEffect(() => {
    const width = window.innerWidth; // 获取窗口的宽度
    const height = window.innerHeight; // 获取窗口的高度
    const circleRadius = Math.min(width, height) * 0.5; // 圆环半径，取宽高较小者的一半
    const wallThickness = 5; // 圆环边界的厚度
    const numSides = 1000; // 圆环多边形的边数，越多边数越接近圆形
    const gapSize = 0; // 圆环缺口大小，0表示无缺口
    const ballRadius = circleRadius * 0.03; // 猎物球的半径，取圆环半径的3%
    const hunterBallRadius = ballRadius * 2; // 猎手球的半径，设为猎物球半径的两倍
    const trailDuration = 300; // 猎物球的轨迹持续显示时间，单位为毫秒
    const maxSpeed = 15; // 猎物球的最大速度
    const minSpeed = 2; // 猎物球的最小速度
    const balls = []; // 存放猎物球的数组
    let hunterBall; // 猎手球的声明，稍后初始化
    let rotationAngle = 0; // 圆环的初始旋转角度，初始为0
    const trails = {}; // 存储球体的轨迹信息，键是球体ID，值是轨迹数组

    const engine = Matter.Engine.create(); // 创建物理引擎实例
    const world = engine.world; // 获取物理世界实例
    engine.gravity.y = 0; // 禁用物理引擎的重力影响，y方向无重力

    // 定义碰撞类别，控制物体之间的碰撞规则
    const ballCategory = 0x0001; // 猎物球的碰撞类别
    const ringCategory = 0x0002; // 圆环的碰撞类别
    const hunterCategory = 0x0004; // 猎手球的碰撞类别

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
    let animationFrameId;
    const update = () => {
      if (!isPaused && !isGameOver) { // 检查是否暂停或游戏结束
        Matter.Engine.update(engine, 1000 / 60); // 手动更新物理引擎，每秒60帧
        Matter.Render.world(render); // 手动渲染画面
      }
      animationFrameId = requestAnimationFrame(update); // 递归调用，保持循环
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

      // 检查猎手球的半径是否大于圆环的半径，如果是，游戏结束
      if (hunterBall.circleRadius >= circleRadius) {
        
        setIsGameOver(true); // 设置游戏结束状态
        setIsPaused(true); // 暂停游戏
        const collisionSound = new Audio(process.env.PUBLIC_URL + '/sound/win.mp3');
        collisionSound.play();
      }
    });

    // 碰撞事件监听，处理猎物球和猎手球与墙体碰撞的声音
    Matter.Events.on(engine, 'collisionStart', function (event) {
      event.pairs.forEach(function (pair) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 检查猎手球与墙壁的碰撞
        if ((bodyA === hunterBall && ringBodies.includes(bodyB)) || (bodyB === hunterBall && ringBodies.includes(bodyA))) {
          const collisionSound = new Audio(process.env.PUBLIC_URL + '/sound/3.mp3');
          collisionSound.play();
        }

        // 检查猎物球与墙壁的碰撞
        if ((balls.includes(bodyA) && ringBodies.includes(bodyB)) || (balls.includes(bodyB) && ringBodies.includes(bodyA))) {
          const collisionSound = new Audio(process.env.PUBLIC_URL + '/sound/2.mp3');
          collisionSound.play();
        }

        // 检查猎手球与猎物球的碰撞
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

          const collisionSound = new Audio(process.env.PUBLIC_URL + '/sound/1.mp3');
          collisionSound.play();
        }
      });
    });

    // 销毁阶段清除物理引擎与渲染
    return () => {
      Matter.Engine.clear(engine);
      Matter.Render.stop(render);
      Matter.World.clear(world, false);
      cancelAnimationFrame(animationFrameId); // 取消动画帧循环
    };
  }, [isPaused, isGameOver]); // 添加依赖项isPaused, isGameOver

  // 键盘监听事件，按下“P”键暂停或恢复游戏
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'p') {
        setIsPaused((prev) => !prev); // 切换暂停状态
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

export default BigBallEatSmallBalls;
