import _ from "lodash";
import * as R from "ramda";
import { NavigateOptions, Params, SetParams } from "solid-app-router";
import { Component, createEffect, mergeProps } from "solid-js";
import { $RAW, createStore } from "solid-js/store";

import * as Engine from "../engine/Engine";
import SnakeGameDisplay from "../components/SnakeGameDisplay";
import { withMappedProps } from "../utils/hocs/withMappedProps";
import {
  WithSearchParamsProps,
  withSearchParams,
} from "../utils/hocs/withSearchParams";
import { Agent, P5Arg } from "../types";
import { playYourselfAgent } from "../agent/playYourself.agent";

interface SnakePageSearchParams extends Params {
  seed: string;
  height: string;
  width: string;
}

interface SnakePageSearchMappedParams {
  seed: number;
  height: number;
  width: number;
}

interface SnakePageProps<P> extends WithSearchParamsProps<P> {
  searchParams: P;
  setSearchParams: (
    params: SetParams,
    options?: Partial<NavigateOptions<unknown>> | undefined
  ) => void;
  agent?: Agent;
}

const BaseSnakePage: Component<SnakePageProps<SnakePageSearchMappedParams>> = (
  props
) => {
  const regenerate = (
    seed = _.random(10000, false),
    width = 60,
    height = 60
  ) => {
    props.setSearchParams({ seed, width, height });
  };
  if (
    !props.searchParams.seed ||
    !props.searchParams.width ||
    !props.searchParams.height
  ) {
    regenerate(
      props.searchParams.seed || _.random(10000, false),
      props.searchParams.width || 60,
      props.searchParams.height || 60
    );
  }
  const mergedProps = mergeProps(
    {
      agent: playYourselfAgent,
    },
    props
  );
  const [gameState, setGameState] = createStore(
    Engine.create(
      mergedProps.searchParams.width,
      mergedProps.searchParams.height,
      mergedProps.searchParams.seed
    )
  );

  createEffect(() => {
    setGameState(
      Engine.create(
        mergedProps.searchParams.width,
        mergedProps.searchParams.height,
        mergedProps.searchParams.seed
      )
    );
  });

  createEffect(() => {
    console.log(
      "mergedProps.searchParams.seed",
      mergedProps.searchParams.seed,
      typeof mergedProps.searchParams.seed
    );
    console.log(
      "mergedProps.searchParams.width",
      mergedProps.searchParams.width,
      typeof mergedProps.searchParams.width
    );
    console.log(
      "mergedProps.searchParams.height",
      mergedProps.searchParams.height,
      typeof mergedProps.searchParams.height
    );
    console.log(gameState[$RAW]);
  });

  return (
    <div>
      <div>Snake Page</div>
      <SnakeGameDisplay
        gameState={gameState}
        canvasHeight={600}
        canvasWidth={600}
        onDraw={(p5) => {
          setGameState(
            Engine.update(gameState, mergedProps.agent!(gameState, { p5 }))
          );
        }}
      />
      <button onClick={() => regenerate()}>Re-generate</button>
    </div>
  );
};

export default R.compose(
  withSearchParams,
  withMappedProps<
    SnakePageProps<SnakePageSearchParams>,
    SnakePageProps<SnakePageSearchMappedParams>
  >((props) =>
    mergeProps(props, {
      searchParams: {
        seed: parseInt(props.searchParams.seed),
        width: parseInt(props.searchParams.width),
        height: parseInt(props.searchParams.height),
      },
    })
  )
)(BaseSnakePage);
