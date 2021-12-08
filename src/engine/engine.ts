import _ from "lodash";
import * as R from "ramda";

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
  const mappedSeed = seed % (width * height);
  return {
    seed,
    turn: 0,
    status: "running",
    width,
    height,
    snake: [{ x: Math.floor(width / 2), y: Math.floor(height / 2) }],
    direction: "right",
    food: { x: mappedSeed % width, y: Math.floor(mappedSeed / height) },
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

export const update = (
  gameState: GameState,
  action = gameState.direction
): GameState => {
  if (gameState.status === "gameOver") return gameState;

  const mappedSeed = gameState.seed % (gameState.width * gameState.height);
  const correctedAction = correctAction(action, gameState.direction);
  const newPosition = R.mergeWith(
    R.add,
    R.head(gameState.snake),
    translate(correctedAction)
  );
  const movedSnake = R.prepend(newPosition, gameState.snake);
  const newSnake = R.equals(gameState.food, R.head(movedSnake))
    ? movedSnake
    : R.init(movedSnake);
  const newGameState = R.merge<GameState, Partial<GameState>>(gameState, {
    snake: newSnake,
    direction: correctedAction,
    turn: gameState.turn + 1,
    food: R.equals(gameState.food, R.head(newSnake))
      ? {
          x:
            (gameState.food.x + (mappedSeed % gameState.width)) %
            gameState.width,
          y:
            (gameState.food.y + Math.floor(mappedSeed / gameState.height)) %
            gameState.height,
        }
      : gameState.food,
  });

  return checkStatus(newGameState);
};
