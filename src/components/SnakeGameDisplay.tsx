import { createMemo, mergeProps } from "solid-js";
import { prototype as p5Proto } from "p5";

import * as Engine from "../engine/engine";
import { Canvas } from "./Canvas";

type P5Arg = typeof p5Proto;

interface SnakeGameDisplayProps {
  gameState: Engine.GameState;
  canvasWidth: number;
  canvasHeight: number;
  onDraw?: (arg: P5Arg) => void;
  color?: { background: string; snake: string; food: string };
}

const SnakeGameDisplay = (props: SnakeGameDisplayProps) => {
  const mergedProps = mergeProps(
    {
      onDraw: () => {},
      color: { background: "black", snake: "white", food: "orange" },
    },
    props
  );
  const getXScale = createMemo(
    () => mergedProps.canvasWidth / mergedProps.gameState.width
  );
  const getYScale = createMemo(
    () => mergedProps.canvasHeight / mergedProps.gameState.height
  );

  return (
    <Canvas
      setup={(arg) => {
        arg.createCanvas(mergedProps.canvasWidth, mergedProps.canvasHeight);
      }}
      draw={(arg) => {
        arg.background(mergedProps.color.background);
        mergedProps.onDraw(arg);
        Engine.show(arg, mergedProps.gameState, {
          scale: {
            x: getXScale(),
            y: getYScale(),
          },
          color: {
            snake: mergedProps.color.snake,
            food: mergedProps.color.food,
          },
        });
      }}
    />
  );
};

export default SnakeGameDisplay;
