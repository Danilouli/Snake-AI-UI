import _ from "lodash";
import * as R from "ramda";
import { prototype as p5Proto } from "p5";

type P5Arg = typeof p5Proto;

import { Action, Direction } from "./constants";

export const possibleStatus = ["running", "gameOver"] as const;
export type Status = typeof possibleStatus[number];

export type Position = {
  x: number;
  y: number;
};

export type GameState = {
  seed: number;
  turn: number;
  status: Status;
  width: number;
  height: number;
  snake: Position[];
  direction: Direction;
  food: Position;
};

export const create = (
  width = 60,
  height = 60,
  seed = _.random(width * height, false)
): GameState => {
  return {
    seed,
    turn: 0,
    status: "running",
    width,
    height,
    snake: [{ x: Math.floor(width / 2), y: Math.floor(height / 2) }],
    direction: "right",
    food: { x: seed % width, y: Math.floor(seed / height) % height },
  };
};

const translate: (direction: Direction) => Position = R.cond([
  [R.equals<Direction>("up"), R.always({ x: 0, y: -1 })],
  [R.equals<Direction>("down"), R.always({ x: 0, y: 1 })],
  [R.equals<Direction>("left"), R.always({ x: -1, y: 0 })],
  [R.equals<Direction>("right"), R.always({ x: 1, y: 0 })],
]);

const correctAction = (action: Action, direction: Direction): Action => {
  if (action === "left" && direction === "right") {
    return "right";
  }
  if (action === "right" && direction === "left") {
    return "left";
  }
  if (action === "up" && direction === "down") {
    return "down";
  }
  if (action === "down" && direction === "up") {
    return "up";
  }
  return action;
};

const checkStatus = (state: GameState): GameState => {
  const { snake, width, height } = state;
  const head = snake[0];
  const isOutOfBounds =
    head.x < 0 || head.x >= width || head.y < 0 || head.y >= height;
  const isColliding = snake
    .slice(1)
    .some((part) => part.x === head.x && part.y === head.y);
  if (isOutOfBounds || isColliding) {
    return { ...state, status: "gameOver" };
  }
  return state;
};

const nextFoodPosition = (state: GameState): Position => {
  const { width, height, food, seed } = state;

  const foodPosition = {
    x: (food.x + (seed % width)) % width,
    y: (food.y + Math.floor(seed / height)) % height,
  };

  const isFoodCorrect: (snake: Position[]) => boolean = R.none(
    R.equals(state.food)
  );

  return isFoodCorrect(state.snake)
    ? foodPosition
    : nextFoodPosition({ ...state, seed: seed + 1 });
};

export const update = (
  gameState: GameState,
  action = gameState.direction
): GameState => {
  if (gameState.status === "gameOver") return gameState;

  const correctedAction = correctAction(action, gameState.direction);
  const newHead = R.mergeWith(
    R.add,
    R.head(gameState.snake),
    translate(correctedAction)
  );
  const movedSnake = R.prepend(newHead, gameState.snake);
  const newSnake = R.equals(gameState.food, R.head(movedSnake))
    ? movedSnake
    : R.init(movedSnake);
  const newGameState = R.merge<GameState, Partial<GameState>>(gameState, {
    snake: newSnake,
    direction: correctedAction,
    turn: gameState.turn + 1,
    food: R.equals(gameState.food, R.head(newSnake))
      ? nextFoodPosition(gameState)
      : gameState.food,
  });

  return checkStatus(newGameState);
};

export const show = (
  arg: P5Arg,
  gameState = create(),
  opt = {
    scale: { x: 10, y: 10 },
    color: {
      snake: "white",
      food: "orange",
    },
  }
) => {
  // draw snake
  gameState.snake.forEach((snakeCell) => {
    arg
      .fill(opt.color.snake)
      .rect(snakeCell.x * opt.scale.x, snakeCell.y * opt.scale.y, 10, 10);
  });
  // draw food
  arg
    .fill(opt.color.food)
    .rect(
      gameState.food.x * opt.scale.x,
      gameState.food.y * opt.scale.y,
      10,
      10
    );
};
