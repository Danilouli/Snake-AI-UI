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
  const [gymStore, setGymStore] = createStore<{ gym: NeuroEvolGym }>(
    {
      gym: createNeuroEvolGym({
        seed: props.searchParams.seed,
        height: props.searchParams.height,
        width: props.searchParams.width,
        populationSize: props.searchParams.populationSize,
        mutationRate: props.searchParams.mutationRate,
        numberOfEpochs: 9999999,
        computeFitness: defaultComputeFitness
      })
    }
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
    const allGameOver = !gymStore.gym.state.population.some(({
      gameState
    }) => (gameState.status === "running" && gameState.turn < maxTurns));
    if (allGameOver) {
      const nextGym = gymStore.gym.next();
      if (nextGym) {
        console.log("NEXT GYM", nextGym);
        setGymStore("gym", nextGym);
        // setLaunch(false);
      } else {
        console.log("NO MORE GYM");
      }
    }
  })

  createEffect(() => {
    window.addEventListener("test", (e) => {
      const nextGym = gymStore.gym.next();
      if (nextGym) {
        console.log("NEXT GYM !", nextGym);
        setGymStore("gym", nextGym);
      }
    });
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
      <Index each={gymStore.gym.state.population}>
        {(popul, index) => {
          console.log("ADADAD");
          return (
            <div style={{
              margin: "10px",
            }}>
              <SnakeGameDisplay
                gameState={popul().gameState}
                canvasHeight={100}
                canvasWidth={100}
                onDraw={(p5) => {
                  if (launch()) {
                    const decision = popul().agent.decide(popul().gameState, {});
                    // console.log("the decision", decision);
                    console.log("before", popul().gameState.snake[0].x);
                    const nextGameState = Engine.update(popul().gameState, popul().agent.decide(popul().gameState, {}));
                    // popul.gameState = nextGameState;
                    console.log("after", nextGameState.snake[0].x);
                    setGymStore("gym", "state", "population", index, "gameState", () => ({ ...nextGameState }));
                  }
                }}
              />
            </div>
          )
        }}
      </Index>
      <button onClick={() => setLaunch(!launch())}>LAUNCH</button>
      <div>{gymStore.gym.state.epochs}</div>
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
