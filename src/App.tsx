import { Component, createSignal } from "solid-js";

import styles from "./App.module.css";
import { Canvas } from "./Canvas";
import * as Vincent from "./engine/engine";
import { Action } from "./engine/constants";

const arrows = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
};

const App: Component = () => {
  const [getFrameRate, setFrameRate] = createSignal(30);
  const [getWidth, setWidth] = createSignal(60);
  const [getHeight, setHeight] = createSignal(60);
  const [getScale, setScale] = createSignal(10);
  const [getGameState, setGameState] = createSignal(Vincent.create(getWidth(), getHeight()));

  return (
    <div class={styles.App}>
      <input type="number" value={getWidth()} onchange={(e) => setWidth(e.currentTarget.valueAsNumber)} />
      <input type="number" value={getHeight()} onchange={(e) => setHeight(e.currentTarget.valueAsNumber)} />
      <Canvas
        setup={(arg) => {
          arg.createCanvas(getWidth() * getScale(), getHeight() * getScale());
          arg.frameRate(getFrameRate());
        }}
        draw={(arg) => {
          arg.background('#000');
          let action: Action | undefined =
            arg.keyIsDown(arrows.up) ? 'up'
              : arg.keyIsDown(arrows.down) ? 'down'
                : arg.keyIsDown(arrows.left) ? 'left'
                  : arg.keyIsDown(arrows.right) ? 'right' : undefined;
          setGameState(Vincent.update(getGameState(), action));
          getGameState().snake.forEach((snakeCell) => {
            arg.fill('#fff').rect(snakeCell.x * getScale(), snakeCell.y * getScale(), 10, 10);
          });
          arg.fill('orange').rect(getGameState().food.x * getScale(), getGameState().food.y * getScale(), 10, 10);
        }}
      />
    </div>
  );
};

export default App;
