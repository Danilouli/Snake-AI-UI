import { prototype as p5Proto } from "p5";

import * as Engine from "./engine/engine";
import { Action } from "./engine/constants";

export type P5Arg = typeof p5Proto;

export type Agent<C = { p5: P5Arg }> = (
  gameState: Engine.GameState,
  ctx: C
) => Action;
