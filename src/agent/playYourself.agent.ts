import * as Engine from "../engine/engine";
import { Action } from "../engine/constants";
import { AgentFactory } from "../types";

const ARROW = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
};

interface PlayYourselfAgentInternalState {}

export const createPlayYourselfAgent: AgentFactory<PlayYourselfAgentInternalState> =
  () => {
    const internalState: PlayYourselfAgentInternalState = {};
    return {
      internalState,
      decide: (gameState, ctx) => {
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
      },
    };
  };
