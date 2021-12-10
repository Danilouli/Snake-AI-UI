import { Action } from "../engine/constants";
import { Agent } from "../types";

const ARROW = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
};

export const playYourselfAgent: Agent = (gameState, ctx) => {
  const action: Action = ctx.p5.keyIsDown(ARROW.UP)
    ? "up"
    : ctx.p5.keyIsDown(ARROW.DOWN)
    ? "down"
    : ctx.p5.keyIsDown(ARROW.LEFT)
    ? "left"
    : ctx.p5.keyIsDown(ARROW.RIGHT)
    ? "right"
    : gameState.direction;
  return action;
};
