import _ from "lodash";
import * as R from "ramda";
import { createEffect, Index, mergeProps } from "solid-js";
import { $RAW, createStore } from "solid-js/store";
import { NavigateOptions, Params, SetParams } from "solid-app-router";
import {
  withSearchParams,
  WithSearchParamsProps,
} from "../../../../utils/hocs/withSearchParams";
import { withMappedProps } from "../../../../utils/hocs/withMappedProps";
import {
  createNeuroEvolutionAgentGym,
  NeuroEvolutionAgentGym,
} from "../../../../agent/vincent/neuro-evolution.agent";
import SnakeGameDisplay from "../../../../components/SnakeGameDisplay";

interface NeuroEvolutionGymPageSearchParams extends Params {
  seed: string;
  height: string;
  width: string;
  populationSize: string;
  mutationRate: string;
}

interface NeuroEvolutionGymPageSearchMappedParams extends SetParams {
  seed: number;
  height: number;
  width: number;
  populationSize: number;
  mutationRate: number;
}

interface NeuroEvolutionPageProps<P> extends WithSearchParamsProps<P> {
  searchParams: P;
  setSearchParams: (
    params: SetParams,
    options?: Partial<NavigateOptions<any>> | undefined
  ) => void;
}

const NeuroEvolutionGymPage = (
  props: NeuroEvolutionPageProps<NeuroEvolutionGymPageSearchMappedParams>
) => {
  const [gym, setGym] = createStore<NeuroEvolutionAgentGym>(
    createNeuroEvolutionAgentGym({
      seed: props.searchParams.seed,
      height: props.searchParams.height,
      width: props.searchParams.width,
      populationSize: props.searchParams.populationSize,
      mutationRate: props.searchParams.mutationRate,
    })
  );

  createEffect(() => {
    setGym(
      createNeuroEvolutionAgentGym({
        seed: props.searchParams.seed,
        height: props.searchParams.height,
        width: props.searchParams.width,
        populationSize: props.searchParams.populationSize,
        mutationRate: props.searchParams.mutationRate,
      })
    );
  });

  createEffect(() => {
    props.setSearchParams(props.searchParams);
  });

  createEffect(() => {
    console.log(gym[$RAW]);
  });

  return (
    <div>
      <h1>NeuroEvolution Gym</h1>
      <Index each={gym.environments}>
        {(environment) => (
          <SnakeGameDisplay
            gameState={environment()}
            canvasHeight={100}
            canvasWidth={100}
          />
        )}
      </Index>
    </div>
  );
};

export default R.compose(
  withSearchParams,
  withMappedProps<
    NeuroEvolutionPageProps<NeuroEvolutionGymPageSearchParams>,
    NeuroEvolutionPageProps<NeuroEvolutionGymPageSearchMappedParams>
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
)(NeuroEvolutionGymPage);
