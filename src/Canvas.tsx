import { onMount } from "solid-js";
import p5, { prototype as p5Proto } from "p5";

type P5Arg = typeof p5Proto;

export const p5Events = [
  "draw",
  "windowResized",
  "preload",
  "mouseClicked",
  "doubleClicked",
  "mouseMoved",
  "mousePressed",
  "mouseWheel",
  "mouseDragged",
  "mouseReleased",
  "keyPressed",
  "keyReleased",
  "keyTyped",
  "touchStarted",
  "touchMoved",
  "touchEnded",
  "deviceMoved",
  "deviceTurned",
  "deviceShaken",
  "keyIsDown",
] as const;

export type P5Event = (typeof p5Events)[number];

export type CanvasProps = {
  setup: (arg: P5Arg) => void;
} & Partial<{
  [key in P5Event]: (arg: P5Arg) => void;
}>;


export const Canvas = (props: CanvasProps) => {
  let divRef: HTMLDivElement | undefined = undefined;

  onMount(() => {
    new p5((arg: P5Arg) => {
      arg.setup = () => {
        props.setup(arg);
      }

      p5Events.forEach((event) => {
        if (props[event]) {
          arg[event] = (() => {
            (props[event] as any)(arg);
          }) as any;
        }
      });
    }, divRef);
  });

  return (
    <div ref={divRef}></div>
  )
};