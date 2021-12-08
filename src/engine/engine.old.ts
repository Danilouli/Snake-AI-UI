import { Direction, Action } from "./constants";

export const cellContent = ["head", "body", "food", "empty"] as const;
export type CellContent = typeof cellContent[number];

export type Cell = {
  x: number;
  y: number;
  content: CellContent;
  direction: Direction;
};

export type GameState = {
  turn: number;
  snake: Cell[];
  map: Cell[][];
  width: number;
  height: number;
  gameOver?: "hitWall" | "hitSelf";
};

const initialSnake: Cell[] = [
  ...Array.from({ length: 20 }).map(
    (_, i): Cell => ({
      x: i,
      y: 0,
      content: "body",
      direction: "right",
    })
  ),
  {
    x: 20,
    y: 0,
    content: "head",
    direction: "right",
  },
];

export const create = (width: number, height: number): GameState => {
  return {
    turn: 0,
    map: Array.from({ length: width }).map((_, x) =>
      Array.from({ length: height }).map((_, y) => ({
        x,
        y,
        content:
          x === 10 && y === 10 ? "food" : x === 0 && y === 0 ? "head" : "empty",
        direction: "right",
      }))
    ),
    height,
    width,
    snake: initialSnake,
  };
};

export const getHead = (gameState: GameState): Cell => {
  const head = gameState.map.flat().find((cell) => cell.content === "head");
  if (!head) {
    throw new Error("No head found");
  }
  return head;
};

export const getTranslationDirection = (
  direction: Direction
): { x: number; y: number } =>
  direction === "up"
    ? { x: 0, y: -1 }
    : direction === "down"
    ? { x: 0, y: 1 }
    : direction === "left"
    ? { x: -1, y: 0 }
    : direction === "right"
    ? { x: 1, y: 0 }
    : { x: 0, y: 0 };

export const update = (gameState: GameState, action?: Action): GameState => {
  if (gameState.gameOver) return gameState;

  const nextSnake = [...gameState.snake];

  let gameOver: GameState["gameOver"] = undefined;

  for (let i = 0; i < nextSnake.length; i++) {
    const snakeCell = nextSnake[i];
    const translationDirection = getTranslationDirection(snakeCell.direction);
    const nextPos = {
      x: snakeCell.x + translationDirection.x,
      y: snakeCell.y + translationDirection.y,
    };
    const snakeCellForNextPos = nextSnake.find(
      (snakeCell) => snakeCell.x === nextPos.x && snakeCell.y === nextPos.y
    );
    if (snakeCellForNextPos && snakeCell.content === "head") {
      gameOver = "hitSelf";
    }
    if (
      (nextPos.x < 0 ||
        nextPos.x > gameState.height ||
        nextPos.y < 0 ||
        nextPos.y > gameState.width) &&
      snakeCell.content === "head"
    ) {
      gameOver = "hitWall";
    }
    snakeCell.x = nextPos.x;
    snakeCell.y = nextPos.y;
    if (i === nextSnake.length - 1) {
      const oldDirection = snakeCell.direction;
      let nextDirection = action;
      if (oldDirection === "right" && nextDirection === "left") {
        nextDirection = "right";
      }
      if (oldDirection === "left" && nextDirection === "right") {
        nextDirection = "left";
      }
      if (oldDirection === "up" && nextDirection === "down") {
        nextDirection = "up";
      }
      if (oldDirection === "down" && nextDirection === "up") {
        nextDirection = "down";
      }
      snakeCell.direction = nextDirection || snakeCell.direction;
    } else {
      snakeCell.direction = nextSnake[i + 1].direction;
    }
  }

  return {
    height: gameState.height,
    width: gameState.width,
    turn: gameState.turn + 1,
    map: gameState.map.map((row) =>
      row.map((cell): Cell => {
        const snakeCell = nextSnake.find(
          (snakeCell) => snakeCell.x === cell.x && snakeCell.y === cell.y
        );
        return {
          x: cell.x,
          y: cell.y,
          content: snakeCell ? snakeCell.content : "empty",
          direction: snakeCell?.direction || cell.direction,
        };
      })
    ),
    gameOver,
    snake: nextSnake,
  };
};
