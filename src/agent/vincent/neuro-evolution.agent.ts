import _ from "lodash";
import * as R from "ramda";
// @ts-ignore
import ml5 from "ml5";

import { possibleActions } from "../../engine/constants";
import { Agent, AgentFactory } from "../../types";
import * as Engine from "../../engine/engine";

// Formalize the problem
// the inputs :
// - the current state (as a matrix for each cell) :
//   - 0 or 1 if the snake head is here
//   - 0 or 1 if the snake body is here
//   - the snake body length/age/part
//   - 0 or 1 if the food is here
// - the current direction of the snake (as matrix):
//   - 0 or 1 if the snake is going right
//   - 0 or 1 if the snake is going left
//   - 0 or 1 if the snake is going up
//   - 0 or 1 if the snake is going down
// the outputs :
// - the action decided by the agent as a matrix :
//   - 0 or 1 if the agent wants to go right
//   - 0 or 1 if the agent wants to go left
//   - 0 or 1 if the agent wants to go up
//   - 0 or 1 if the agent wants to go down

export interface NeuroEvolutionInternalState {
  model: ReturnType<typeof ml5.neuralNetwork>;
}

export interface NeuroEvolutionContext {}

export type NeuroEvolutionAgent = Agent<
  NeuroEvolutionInternalState,
  NeuroEvolutionContext
>;

export const mapObservation = (observation: Engine.GameState) => {
  const snakeHeadMatrix = R.range(
    0,
    observation.width * observation.height
  ).map((n) => {
    return observation.snake[0].x === n % observation.width &&
      observation.snake[0].y === Math.floor(n / observation.width)
      ? 1
      : 0;
  });
  const snakeBodyMatrix = R.range(
    0,
    observation.width * observation.height
  ).map((n) => {
    return observation.snake.some((snakePart) => {
      return (
        snakePart.x === n % observation.width &&
        snakePart.y === Math.floor(n / observation.width)
      );
    })
      ? 1
      : 0;
  });
  const snakeBodyLengthMatrix = R.range(
    0,
    observation.width * observation.height
  ).map((n) => {
    const snakeBodyLength = observation.snake.findIndex((snakePart) => {
      return (
        snakePart.x === n % observation.width &&
        snakePart.y === Math.floor(n / observation.width)
      );
    });
    return snakeBodyLength === -1 ? 0 : snakeBodyLength;
  });
  const foodMatrix = R.range(0, observation.width * observation.height).map(
    (n) => {
      return observation.food.x === n % observation.width &&
        observation.food.y === Math.floor(n / observation.width)
        ? 1
        : 0;
    }
  );
  const directionMatrix = [
    observation.direction === "right" ? 1 : 0,
    observation.direction === "left" ? 1 : 0,
    observation.direction === "up" ? 1 : 0,
    observation.direction === "down" ? 1 : 0,
  ];
  const input = [
    ...snakeHeadMatrix,
    ...snakeBodyMatrix,
    ...snakeBodyLengthMatrix,
    ...foodMatrix,
    ...directionMatrix,
  ];
  return input;
};

export interface BuildNeuroEvolutionAgentProps {
  observation: Engine.GameState;
  options: Object;
  internalState: NeuroEvolutionInternalState;
}

export const buildNeuroEvolutionAgent = ({
  observation = Engine.create(),
  options = {
    inputs: mapObservation(observation).length,
    outputs: possibleActions,
    task: "classification",
    noTraining: true,
    // debug: true,
  },
  internalState = {
    model: ml5.neuralNetwork(options),
  },
}: Partial<BuildNeuroEvolutionAgentProps>): NeuroEvolutionAgent => {
  return {
    internalState,
    decide: (observation) => {
      const input = mapObservation(observation);
      const decision = internalState.model.classifySync(input)[0].label;
      return decision;
    },
  };
};

export const createNeuroEvolutionAgent: AgentFactory<
  NeuroEvolutionInternalState,
  NeuroEvolutionContext
> = (observation: Engine.GameState) => {
  const options = {
    inputs: mapObservation(observation).length,
    outputs: possibleActions,
    task: "classification",
    noTraining: true,
    // debug: true,
  };
  const internalState: NeuroEvolutionInternalState = {
    model: ml5.neuralNetwork(options),
  };
  return buildNeuroEvolutionAgent({
    observation,
    options,
    internalState,
  });
};

export interface NeuroEvolutionAgentGymState {
  epochs: number;
  mutationRate: number;
  environments: Engine.GameState[];
  population: Agent<NeuroEvolutionInternalState, NeuroEvolutionContext>[];
}

export interface CreateNeuroEvolutionAgentGymDependencies {
  computeFitness: (
    environment: Engine.GameState,
    agent: Agent<NeuroEvolutionInternalState, {}>
  ) => number;
}

export interface CreateNeuroEvolutionAgentGymProps
  extends NeuroEvolutionAgentGymState,
    CreateNeuroEvolutionAgentGymDependencies {
  populationSize: number;
  seed: number;
  width: number;
  height: number;
}

export interface NeuroEvolutionAgentGym extends NeuroEvolutionAgentGymState {
  step: () => NeuroEvolutionAgentGym;
}

export const isGymOpen = ({ epochs }: NeuroEvolutionAgentGymState) => {
  return epochs > 0;
};

export const isGymClose = R.complement(isGymOpen);

export const isEpochEnd = ({ environments }: NeuroEvolutionAgentGymState) => {
  return environments.every((environment) => environment.status === "gameOver");
};

const pickOne = (
  normalizedFitness: number[],
  population: NeuroEvolutionAgent[]
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
  population: Agent<NeuroEvolutionInternalState, NeuroEvolutionContext>[]
): NeuroEvolutionAgent => {
  const father = pickOne(normalizedFitness, population);
  const mother = pickOne(normalizedFitness, population);
  const child = buildNeuroEvolutionAgent({
    internalState: {
      model: father.internalState.model.crossover(mother),
    },
  });
  child.internalState.model.mutate(mutateRate);
  return child;
};

const nextGeneration =
  ({ computeFitness }: CreateNeuroEvolutionAgentGymDependencies) =>
  (
    mutationRate: number,
    population: NeuroEvolutionAgent[],
    environments: Engine.GameState[]
  ): NeuroEvolutionAgent[] => {
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

export const nextEpoch = (props: CreateNeuroEvolutionAgentGymProps) => {
  const newSeed = Engine.randomSeed();

  const newAgent = createNeuroEvolutionAgentGym({
    populationSize: props.populationSize,
    width: props.width,
    height: props.height,
    mutationRate: props.mutationRate,
    epochs: props.epochs - 1,
    seed: newSeed,
    computeFitness: props.computeFitness,
    population: nextGeneration(props)(
      props.mutationRate,
      props.population,
      props.environments
    ),
    environments: props.environments.map(() =>
      Engine.create(props.width, props.height, newSeed)
    ),
  });

  return newAgent;
};

export const nextStep = (props: CreateNeuroEvolutionAgentGymProps) => {
  return createNeuroEvolutionAgentGym({
    ...props,
    populationSize: props.population.length,
    width: props.environments[0].width,
    height: props.environments[0].height,
    environments: R.zip(props.environments, props.population).map(
      ([env, agent]) => {
        const action = agent.decide(env, {});
        return Engine.update(env, action);
      }
    ),
  });
};

export const freePopulation = (
  population: NeuroEvolutionAgent[]
): Agent<NeuroEvolutionInternalState, NeuroEvolutionContext>[] => {
  return population.map((agent) => {
    agent.internalState.model.dispose();
    return agent;
  });
};

export const createNeuroEvolutionAgentGym = ({
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
  population = environments.map((env) => createNeuroEvolutionAgent(env)),
}: Partial<CreateNeuroEvolutionAgentGymProps>): NeuroEvolutionAgentGym => {
  const state: NeuroEvolutionAgentGymState = {
    epochs,
    mutationRate,
    environments,
    population,
  };
  const props: CreateNeuroEvolutionAgentGymProps = {
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
        props: CreateNeuroEvolutionAgentGymProps
      ) => NeuroEvolutionAgentGym = R.cond([
        [isGymClose, createNeuroEvolutionAgentGym],
        [isEpochEnd, nextEpoch],
        [R.T, nextStep],
      ]);
      const newGym = buildNewGym(props);
      freePopulation(state.population);

      return newGym;
    },
  };
};
