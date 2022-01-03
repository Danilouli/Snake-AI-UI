import * as tensorflow from "@tensorflow/tfjs";
import { Agent, AgentFactory } from "../../../types";
import * as Engine from "../../../engine/engine";
import * as R from "ramda";
import { possibleActions } from "../../../engine/constants";

const tf = (window as any).tf as (typeof tensorflow);

const boolbin = (x: boolean) => x ? 1 : 0;

type NumberIn01 = number;
type Bin = 0 | 1;

type InputCell = [NumberIn01, NumberIn01, Bin, Bin, Bin]; // [relativeX, relativeY, isSnake, isHead, isFood];
type InputDirection = [Bin, Bin, Bin, Bin]; // The direction of the snake, 0 or 1, right, left, up, down;

type NeuroEvolInputObj = {
  map: InputCell[];
  direction: InputDirection;
};

type NeuroEvolInternalState = {
  model: tensorflow.Sequential;
};

type NeuroEvolContext = {};

type NeuroEvolAgent = Agent<
  NeuroEvolInternalState,
  NeuroEvolContext
>;

const getInputObj = (observation: Engine.GameState): NeuroEvolInputObj => {
  const map: InputCell[] = R.range(
    0,
    observation.width * observation.height
  ).map((n) => {
    const pointX = n % observation.width;
    const pointY = Math.floor(n / observation.width);
    return [
      pointX / observation.width,
      pointY / observation.height,
      boolbin(observation.snake.some(({x,y}) => ((x === pointX) && (y === pointY)))),
      boolbin(observation.snake[0].x === pointX&& observation.snake[0].y === pointY),
      boolbin(observation.food.x === pointX && observation.food.y === pointY),
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

const inputObjToTensorInput = (inputObj: NeuroEvolInputObj) => {
  const inputArr = [
    ...inputObj.direction,
    ...inputObj.map.flat(),
  ];
  const t = tf.tensor(inputArr, [1, inputArr.length]);
  return t;
};

const getTensorInputFromObs = R.compose(inputObjToTensorInput, getInputObj);

const buildNeuroEvolAgent = ({
  internalState,
}: {
  internalState: NeuroEvolInternalState
}): NeuroEvolAgent => {
  return {
    internalState,
    decide: (observation) => {
      const tensorInput = getTensorInputFromObs(observation);
      // console.log("will decide");
      const decision = internalState.model.predict(tensorInput);
      // console.log("decision", decision.toString());
      return 'right';
    },
  };
};

const neuroEvolAgentFactory: AgentFactory<
  NeuroEvolInternalState,
  NeuroEvolContext
> = (observation: Engine.GameState) => {
  const tensorInput = getTensorInputFromObs(observation);
  const internalState: NeuroEvolInternalState = {
    model: tf.sequential({
      layers: [
        tf.layers.dense({units: 32, inputDim: tensorInput.shape[1], activation: 'sigmoid'}),
        tf.layers.dense({units: 16, inputShape: [32], activation: 'sigmoid'}),
        tf.layers.dense({units: possibleActions.length, inputShape: [16], activation: 'sigmoid'}),
      ]
    }),
  };
  internalState.model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
  return buildNeuroEvolAgent({
    internalState,
  });
};

type Individual = {
  agent: Agent<NeuroEvolInternalState, NeuroEvolContext>;
  gameState: Engine.GameState;
};

type NeuroEvolGymState = {
  epochs: number;
  population: Individual[];
};

type ComputeFitnessFn = (individual: Individual) => number;

export const defaultComputeFitness: ComputeFitnessFn = (individual) => individual.gameState.snake.length;

type CreateNeuroEvolGymParams = {
  populationSize: number;
  seed: number;
  width: number;
  height: number;
  numberOfEpochs: number;
  mutationRate: number;
  computeFitness: ComputeFitnessFn;
};

export type NeuroEvolGym = {
  state: NeuroEvolGymState;
  next: () => NeuroEvolGym | null;
};

const isGymOpened = ({ epochs }: NeuroEvolGymState) => {
  return epochs > 0;
};

const isEpochFinished = (state: NeuroEvolGymState) => {
  return state.population.every((individual) => individual.gameState.status === "gameOver" || individual.gameState.turn >= 200);
};

const pickOneIndividual = (
  normalizedFitnesseses: number[],
  population: Individual[]
) => {
  let index = 0;
  let r = Math.random();
  while (r > 0) {
    r -= normalizedFitnesseses[index];
    index += 1;
  }
  index -= 1;
  return population[index];
};

const reproduce = (
  mutationRate: number,
  normalizedFitnesses: number[],
  population: Individual[]
): NeuroEvolAgent => {
  const father = pickOneIndividual(normalizedFitnesses, population);
  const mother = pickOneIndividual(normalizedFitnesses, population);
  const fatherModel = father.agent.internalState.model;
  const motherModel = mother.agent.internalState.model;
  const fatherWeights = fatherModel.getWeights();
  const motherWeigths = motherModel.getWeights();
  // console.log("weights", fatherWeights, motherWeigths);
  const cross = fatherModel; // UPDATE: fatherModel.crossover(motherModel);
  const child = buildNeuroEvolAgent({
    internalState: {
      model: cross,
    },
  });
  const mutatedChild = child; // UPDATE: child.internalState.model.mutate(mutationRate);
  return mutatedChild;
};

const nextGeneration = (params: {
  mutationRate: number;
  computeFitness: ComputeFitnessFn;
  population: Individual[];
}): NeuroEvolAgent[] => {
    const fitness = params.population.map(
      (indiv) => {
        return params.computeFitness(indiv);
      }
    );
    const fitnessSum = R.sum(fitness);
    const normalizedFitnesses = fitness.map((f) => f / fitnessSum).sort((a, b) => b - a);
    // console.log("normalizedFitnesses", normalizedFitnesses);
    const nextGen = R.range(0, params.population.length).map(() =>
      reproduce(params.mutationRate, normalizedFitnesses, params.population)
    );
    return nextGen;
};

const recCreateNeuroEvolGym = ({
  computeFitness,
  width,
  height,
  mutationRate,
  numberOfEpochs,
  populationSize,
  recPopulation,
  seed,
}: CreateNeuroEvolGymParams & {
  recPopulation?: Individual[];
}): NeuroEvolGym => {
  const population = !!recPopulation?.length ? 
  recPopulation : R.range(0, populationSize).map(() => {
    const gameState = Engine.create(width, height, seed);
    return {
      gameState,
      agent: neuroEvolAgentFactory(gameState),
    };
  });

  const gymState: NeuroEvolGymState = {
    epochs: numberOfEpochs,
    population,
  };

  return {
    state: gymState,
    next: () => {
      const nextGymGeneration = nextGeneration({
        mutationRate,
        computeFitness,
        population: gymState.population,
      });
      const nextEpoch = gymState.epochs - 1;
      if (nextEpoch >= 0) {
        return recCreateNeuroEvolGym({
          computeFitness,
          height,
          width,
          mutationRate,
          numberOfEpochs: nextEpoch,
          populationSize: population.length,
          recPopulation: nextGymGeneration.map(agent => ({
            gameState: Engine.create(width, height, seed),
            agent,
          })),
          seed,
        });  
      } else {
        return null;
      }
    },
  };
};

export const createNeuroEvolGym = (params: CreateNeuroEvolGymParams) => recCreateNeuroEvolGym(params);


////////////////////////

// const learnLinear = async () => {
//   const model = tf.sequential();
//   model.add(tf.layers.dense({units: 1, inputShape: [1]}));
//   model.compile({
//     optimizer: 'sgd',
//     loss: 'meanSquaredError',
//   });

//   const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
//   const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);

//   await model.fit(xs, ys, { epochs: 250 });

//   const prediction = model.predict()
// };

// tf.ready().then(() => {
  // const model = tf.sequential(
  //   {
  //     layers: [
  //       tf.layers.dense({units: 12, inputShape: [1]}),
  //       tf.layers.dense({units: 8, inputShape: [12]}),
  //       tf.layers.dense({units: 1, inputShape: [8]}),
  //     ]
  //   }
  // );
  // // model.add(tf.layers.dense({units: 2, inputShape: [1], activation: 'relu'}));
  // // model.add(tf.layers.dense({units: 1, activation: 'softmax'}));
  
  // // Prepare the model for training: Specify the loss and the optimizer.
  // model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
  
  // // Generate some synthetic data for training.
  // const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
  // const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);
  
  // console.log("Before train : ", model.predict(tf.tensor2d([5], [1, 1])).toString());

  // console.log("xs", xs.toString());

  // // Train the model using the data.
  // model.fit(xs, ys, {epochs: 200}).then(() => {
  //   // Use the model to do inference on a data point the model hasn't seen before:
  //   const tensorInput = tf.tensor2d([5], [1, 1]);
  //   // console.log("input shape", tensorInput.shape);
  //   const pred = model.predict(tensorInput);
  //   console.log("After train: ", pred.toString());
  // });  
// });

