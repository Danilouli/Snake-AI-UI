import _ from "lodash";
import * as R from "ramda";
import { createEffect, createSignal, For, Index, mergeProps } from "solid-js";
import { $RAW, createStore } from "solid-js/store";
import { NavigateOptions, Params, SetParams } from "solid-app-router";
import {
  withSearchParams,
  WithSearchParamsProps,
} from "../../../../utils/hocs/withSearchParams";
import { withMappedProps } from "../../../../utils/hocs/withMappedProps";
import * as Engine from "../../../../engine/engine";
import {
  createNeuroEvolGym,
  defaultComputeFitness,
  NeuroEvolGym
} from "../../../../agent/daniel/neuro-evolution/neuroEvolAgent";
import SnakeGameDisplay from "../../../../components/SnakeGameDisplay";

const maxTurns = 200;

interface NeuroEvolGymPageSearchParams extends Params {
  seed: string;
  height: string;
  width: string;
  populationSize: string;
  mutationRate: string;
}

interface NeuroEvolGymPageSearchMappedParams extends SetParams {
  seed: number;
  height: number;
  width: number;
  populationSize: number;
  mutationRate: number;
}

interface NeuroEvolPageProps<P> extends WithSearchParamsProps<P> {
  searchParams: P;
  setSearchParams: (
    params: SetParams,
    options?: Partial<NavigateOptions<any>> | undefined
  ) => void;
}

const NeuroEvolGymPage = (
  props: NeuroEvolPageProps<NeuroEvolGymPageSearchMappedParams>
) => {
  const [gym, setGym] = createStore<NeuroEvolGym>(
    createNeuroEvolGym({
      seed: props.searchParams.seed,
      height: props.searchParams.height,
      width: props.searchParams.width,
      populationSize: props.searchParams.populationSize,
      mutationRate: props.searchParams.mutationRate,
      numberOfEpochs: 9999999,
      computeFitness: defaultComputeFitness
    })
  );

  const [launch, setLaunch] = createSignal(false);

  // createEffect(() => {
  //   setGym(
  //     createNeuroEvolAgentGym({
  //       seed: props.searchParams.seed,
  //       height: props.searchParams.height,
  //       width: props.searchParams.width,
  //       populationSize: props.searchParams.populationSize,
  //       mutationRate: props.searchParams.mutationRate,
  //     })
  //   );
  // });

  createEffect(() => {
    const allGameOver = !gym.state.population.some(({
      gameState
    }) => (gameState.status === "running" && gameState.turn < maxTurns));
    if (allGameOver) {
      const nextGym = gym.next();
      if (nextGym) {
        setGym(nextGym);
      } else {
        console.log("NO MORE GYM");
      }
    }
  })

  createEffect(() => {
    props.setSearchParams(props.searchParams);
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      "flex-wrap": 'wrap',
      height: '100vh',
      width: '100vw',
      background: 'midnightblue',
      color: 'grey',
    }}>
      <h1>NeuroEvol Gym</h1>
      <For each={gym.state.population}>
        {(popul) => {
          return (
            <div style={{
              margin: "10px",
            }}>
              <SnakeGameDisplay
                gameState={popul.gameState}
                canvasHeight={100}
                canvasWidth={100}
                onDraw={(p5) => {
                  if (launch()) {
                    console.log("old gs", JSON.stringify(popul.gameState));
                    const nextGameState = Engine.update(popul.gameState, popul.agent.decide(popul.gameState, {}));
                    console.log("next gs", nextGameState);
                    popul.gameState = nextGameState;
                  }
                }}
              />
            </div>
          )
        }}
      </For>
      <button onClick={() => setLaunch(!launch())}>LAUNCH</button>
      <div>{gym.state.epochs}</div>
    </div>
  );
};

export default R.compose(
  withSearchParams,
  withMappedProps<
    NeuroEvolPageProps<NeuroEvolGymPageSearchParams>,
    NeuroEvolPageProps<NeuroEvolGymPageSearchMappedParams>
  >((props) =>
    mergeProps(props, {
      searchParams: {
        seed: parseInt(props.searchParams.seed) || _.random(10000, false),
        width: parseInt(props.searchParams.width) || 10,
        height: parseInt(props.searchParams.height) || 10,
        populationSize: parseInt(props.searchParams.populationSize) || 10,
        mutationRate: parseInt(props.searchParams.mutationRate) || 0.1,
      },
    })
  )
)(NeuroEvolGymPage);
