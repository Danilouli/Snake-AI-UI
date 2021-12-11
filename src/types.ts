import { prototype as p5Proto } from "p5";

import * as Engine from "./engine/engine";
import { Action } from "./engine/constants";

export type P5Arg = typeof p5Proto;

export type Agent<IS, C = { p5: P5Arg }> = {
  internalState: IS;
  decide: (observation: Engine.GameState, ctx: C) => Action;
};
export type AgentFactory<IS, C = { p5: P5Arg }> = (
  observation: Engine.GameState
) => Agent<IS, C>;
