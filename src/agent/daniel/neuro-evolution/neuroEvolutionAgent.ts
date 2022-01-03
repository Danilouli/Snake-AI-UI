import * as _ from "lodash";
import * as R from "ramda";
// @ts-ignore
import ml5 from "ml5";

import { possibleActions } from "../../../engine/constants";
import { Agent, AgentFactory } from "../../../types";
import * as Engine from "../../../engine/engine";

const boolbin = (x: boolean) => x ? 1 : 0;

type NumberIn01 = number;

export type InputCell = [NumberIn01, NumberIn01, 0 | 1, 0 | 1, 0 | 1]; // [relativeX, relativeY, isSnake, isHead, isFood];
export type InputDirection = [0 | 1, 0 | 1, 0 | 1, 0 | 1]; // The direction of the snake, 0 or 1, right, left, up, down;

export type NeuroEvolInputObj = {
  map: InputCell[];
  direction: InputDirection;
};

export type NeuroEvolInternalState = {
  model: any;
};

export type NeuroEvolContext = {};

export type NeuroEvolAgent = Agent<
  NeuroEvolInternalState,
  NeuroEvolContext
>;

export const getInputObj = (observation: Engine.GameState): NeuroEvolInputObj => {
  const map: InputCell[] = R.range(
    0,
    observation.width * observation.height
  ).map((n) => {
    return [
      (n % observation.width) / observation.width,
      (n % observation.height) / observation.height,
      boolbin(observation.snake.some(({x,y}) => ((x === n % observation.width) && (y === n % observation.width)))),
      boolbin(observation.snake[0].x === n % observation.width && observation.snake[0].y === n % observation.width),
      boolbin(observation.food.x === n % observation.width && observation.food.y === n % observation.width),
    ]
  });

  const direction: InputDirection = [
    observation.direction === "right" ? 1 : 0,
    observation.direction === "left" ? 1 : 0,
    observation.direction === "up" ? 1 : 0,
    observation.direction === "down" ? 1 : 0,
  ];

  return {
    direction,
    map,
  };
};

export const inputObjToRealInput = (inputObj: NeuroEvolInputObj): number[] => {
  return [
    ...inputObj.direction,
    ...inputObj.map.flat(),
  ];
};

export type BuildNeuroEvolAgentParams = {
  observation?: Engine.GameState;
  options?: {
    inputs: number;
    outputs: string[];
    task: "classification" | "regression";
    noTraining: boolean;
  };
  internalState: NeuroEvolInternalState;
}

const getRealInputObjFromObs = R.compose(inputObjToRealInput, getInputObj);

export const buildNeuroEvolAgent = ({
  observation = Engine.create(),
  options = {
    inputs: getRealInputObjFromObs(observation).length,
    outputs: [...possibleActions],
    task: "classification",
    noTraining: true,
  },
  internalState = {
    model: ml5.neuralNetwork({
      ...options,
      debug: true,
    }),
  },
}: BuildNeuroEvolAgentParams): NeuroEvolAgent => {
  return {
    internalState,
    decide: (observation) => {
      const input = getRealInputObjFromObs(observation);
      const decision = internalState.model.classifySync(input)[0].label;
      return decision;
    },
  };
};

export const neuroEvolAgentFactory: AgentFactory<
  NeuroEvolInternalState,
  NeuroEvolContext
> = (observation: Engine.GameState) => {
const options: BuildNeuroEvolAgentParams['options'] = {
  inputs: getRealInputObjFromObs(observation).length,
  outputs: [...possibleActions],
  task: "classification",
  noTraining: true,
};
const internalState: NeuroEvolInternalState = {
  model: ml5.neuralNetwork({
    ...options,
    debug: true
  }),
};
return buildNeuroEvolAgent({
  observation,
  options,
  internalState,
});
};

export type NeuroEvolAgentGymState = {
  epochs: number;
  mutationRate: number;
  environments: Engine.GameState[];
  population: Agent<NeuroEvolInternalState, NeuroEvolContext>[];
}

export type CreateNeuroEvolGymDependencies = {
  computeFitness: (
    environment: Engine.GameState,
    agent: Agent<NeuroEvolInternalState, {}>
  ) => number;
}

export type CreateNeuroEvolGymParams = {
  populationSize: number;
  seed: number;
  width: number;
  height: number;
} & NeuroEvolAgentGymState & CreateNeuroEvolGymDependencies;

export type NeuroEvolAgentGym = {
  step: () => NeuroEvolAgentGym;
} & NeuroEvolAgentGymState;

export const isGymOpened = ({ epochs }: NeuroEvolAgentGymState) => {
  return epochs > 0;
};

export const isGymClosed = R.complement(isGymOpened);

export const isEpochFinished = ({ environments }: NeuroEvolAgentGymState) => {
  return environments.every((environment) => environment.status === "gameOver" || environment.turn >= 200);
};

const pickOne = (
  normalizedFitness: number[],
  population: NeuroEvolAgent[]
) => {
  let index = 0;
  let r = Math.random();
  while (r > 0) {
    r -= normalizedFitness[index];
    index += 1;
  }
  index -= 1;
  return population[index];
};

const reproduce = (
  mutateRate: number,
  normalizedFitness: number[],
  population: Agent<NeuroEvolInternalState, NeuroEvolContext>[]
): NeuroEvolAgent => {
  const father = pickOne(normalizedFitness, population);
  const mother = pickOne(normalizedFitness, population);
  const child = buildNeuroEvolAgent({
    internalState: {
      model: father.internalState.model.crossover(mother.internalState.model),
    },
  });
  child.internalState.model.mutate(mutateRate);
  return child;
};

const nextGeneration =
  ({ computeFitness }: CreateNeuroEvolGymDependencies) =>
  (
    mutationRate: number,
    population: NeuroEvolAgent[],
    environments: Engine.GameState[]
  ): NeuroEvolAgent[] => {
    const fitness = R.zip(environments, population).map(
      ([environment, agent]) => {
        return computeFitness(environment, agent);
      }
    );
    const fitnessSum = R.sum(fitness);
    const normalizedFitness = fitness.map((f) => f / fitnessSum);
    const newPopulation = R.range(0, population.length).map(() =>
      reproduce(mutationRate, normalizedFitness, population)
    );
    return newPopulation;
  };

export const nextEpoch = (params: CreateNeuroEvolGymParams) => {
  const newSeed = Engine.randomSeed();

  const newAgent = createNeuroEvolGym({
    populationSize: params.populationSize,
    width: params.width,
    height: params.height,
    mutationRate: params.mutationRate,
    epochs: params.epochs - 1,
    seed: newSeed,
    computeFitness: params.computeFitness,
    population: nextGeneration(params)(
      params.mutationRate,
      params.population,
      params.environments
    ),
    environments: params.environments.map(() =>
      Engine.create(params.width, params.height, newSeed)
    ),
  });

  return newAgent;
};

export const nextStep = (params: CreateNeuroEvolGymParams) => {
  return createNeuroEvolGym({
    ...params,
    populationSize: params.population.length,
    width: params.environments[0].width,
    height: params.environments[0].height,
    environments: R.zip(params.environments, params.population).map(
      ([env, agent]) => {
        const action = agent.decide(env, {});
        return Engine.update(env, action);
      }
    ),
  });
};

export const freePopulation = (
  population: NeuroEvolAgent[]
): void => {
  return population.forEach((agent) => {
    try {
      agent.internalState.model.dispose();
      // delete agent.internalState.model;
    } catch (e) {
      console.log("ERR", e);
    }
  });
};

type Individual = {
  agent: Agent<NeuroEvolInternalState, NeuroEvolContext>;
  gameState: Engine.GameState;
};

type ComputeFitnessFn = (individual: Individual) => number;

export const defaultComputeFitness: ComputeFitnessFn = (individual) => individual.gameState.snake.length;

type NeuroEvolGymState = {
  epochs: number;
  population: Individual[];
};

export type NeuroEvolGym = {
  state: NeuroEvolGymState;
  next: () => NeuroEvolGym | null;
};

export const createNeuroEvolGym = ({
  populationSize = 10,
  width = 60,
  height = 60,
  epochs = 10,
  mutationRate = 0.1,
  seed = Engine.randomSeed(),
  computeFitness = (environment, agent) => environment.snake.length,
  environments = R.range(0, populationSize).map(() =>
    Engine.create(width, height, seed)
  ),
  population = environments.map((env) => neuroEvolAgentFactory(env)),
}: Partial<CreateNeuroEvolGymParams>): NeuroEvolAgentGym => {
  const state: NeuroEvolAgentGymState = {
    epochs,
    mutationRate,
    environments,
    population,
  };
  const params: CreateNeuroEvolGymParams = {
    ...state,
    populationSize,
    width,
    height,
    seed,
    computeFitness,
  };

  return {
    ...state,
    step: () => {
      const buildNewGym: (
        params: CreateNeuroEvolGymParams
      ) => NeuroEvolAgentGym = R.cond([
        [isGymClosed, createNeuroEvolGym],
        [isEpochFinished, nextEpoch],
        [R.T, nextStep],
      ]);
      const newGym = buildNewGym(params);
      freePopulation(state.population);
      return newGym;
    },
  };
};
