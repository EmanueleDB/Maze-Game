const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cells = 6;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLenght = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: true,
    width,
    height
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

//Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

//Maze generation
const shuffle = arr => {
  let counter = arr.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }
  return arr;
};

const grid = Array(cells)
  .fill(null)
  .map(() => Array(cells).fill(false));

const verticals = Array(cells)
  .fill(null)
  .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
  .fill(null)
  .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
  if (grid[row][column]) {
    return;
  }
  grid[row][column] = true;
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"]
  ]);
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    if (
      nextRow < 0 ||
      nextRow >= cells ||
      nextColumn < 0 ||
      nextColumn >= cells
    ) {
      continue;
    }
    if (grid[nextRow][nextColumn]) {
      continue;
    }
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLenght + unitLenght / 2,
      rowIndex * unitLenght + unitLenght,
      unitLenght,
      5,
      {
        label: "wall",
        isStatic: true
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLenght + unitLenght,
      rowIndex * unitLenght + unitLenght / 2,
      5,
      unitLenght,
      {
        label: "wall",
        isStatic: true
      }
    );
    World.add(world, wall);
  });
});

//Goal
const goal = Bodies.rectangle(
  width - unitLenght / 2,
  height - unitLenght / 2,
  unitLenght * 0.7,
  unitLenght * 0.7,
  {
    label: "goal",
    isStatic: true
  }
);
World.add(world, goal);

//Ball
const ball = Bodies.circle(unitLenght / 2, unitLenght / 2, unitLenght / 4, {
  label: "ball"
});
World.add(world, ball);

document.addEventListener("keydown", event => {
  const { x, y } = ball.velocity;
  if (event.key === "ArrowUp" || event.which === 38) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }
  if (event.key === "ArrowRight" || event.which === 39) {
    Body.setVelocity(ball, { x: x + 5, y });
  }
  if (event.key === "ArrowDown" || event.which === 40) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (event.key === "ArrowLeft" || event.which === 37) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

//Win condition
Events.on(engine, "collisionStart", event => {
  event.pairs.forEach(collision => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      world.bodies.forEach(body => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
