import type { Component } from "solid-js";

import styles from "./App.module.css";
import { Canvas } from "./Canvas";
import { Action, create, update } from "./engine/engine";

const arrows = {
  up: 38,
  down: 40,
  left: 37,
  right: 39,
};

let x = 20;
let y = 20;
let i = 0;

let gameState = create(60, 60);

const App: Component = () => {
  return (
    <div class={styles.App}>
      <Canvas
        setup={(arg) => {
          arg.createCanvas(600, 600)
        }}
        draw={(arg) => {
          arg.background('#000');
          let action: Action | undefined =
            arg.keyIsDown(arrows.up) ? 'up'
              : arg.keyIsDown(arrows.down) ? 'down'
                : arg.keyIsDown(arrows.left) ? 'left'
                  : arg.keyIsDown(arrows.right) ? 'right' : undefined;
          i++;
          if (i % 2 === 0) {
            gameState = update(gameState, action);
          }
          gameState.snake.forEach((snakeCell) => {
            arg.fill('#fff').rect(snakeCell.x * 10, snakeCell.y * 10, 10, 10);
          });
        }}
      />
    </div>
  );
};

export default App;
