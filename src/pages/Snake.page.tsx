import _ from "lodash";
import * as R from "ramda";
import {
  NavigateOptions,
  Params,
  SetParams,
  useNavigate,
} from "solid-app-router";
import { Component, createEffect, mergeProps } from "solid-js";
import { $RAW, createStore } from "solid-js/store";

import * as Engine from "../engine/Engine";
import SnakeGameDisplay from "../components/SnakeGameDisplay";
import { withMappedProps } from "../utils/hocs/withMappedProps";
import {
  WithSearchParamsProps,
  withSearchParams,
} from "../utils/hocs/withSearchParams";
import { Action } from "../engine/constants";

const ARROW = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
};

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
}

const BaseSnakePage: Component<SnakePageProps<SnakePageSearchMappedParams>> = (
  props
) => {
  const navigate = useNavigate();
  const regenerate = (
    seed = _.random(10000, false),
    width = 60,
    height = 60
  ) => {
    navigate(`/snake?seed=${seed}&width=${width}&height=${height}`);
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
  const [gameState, setGameState] = createStore(
    Engine.create(
      props.searchParams.width,
      props.searchParams.height,
      props.searchParams.seed
    )
  );

  createEffect(() => {
    setGameState(
      Engine.create(
        props.searchParams.width,
        props.searchParams.height,
        props.searchParams.seed
      )
    );
  });

  createEffect(() => {
    console.log(
      "props.searchParams.seed",
      props.searchParams.seed,
      typeof props.searchParams.seed
    );
    console.log(
      "props.searchParams.width",
      props.searchParams.width,
      typeof props.searchParams.width
    );
    console.log(
      "props.searchParams.height",
      props.searchParams.height,
      typeof props.searchParams.height
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
        onDraw={(arg) => {
          let action: Action | undefined = arg.keyIsDown(ARROW.UP)
            ? "up"
            : arg.keyIsDown(ARROW.DOWN)
            ? "down"
            : arg.keyIsDown(ARROW.LEFT)
            ? "left"
            : arg.keyIsDown(ARROW.RIGHT)
            ? "right"
            : undefined;
          setGameState(Engine.update(gameState, action));
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
