export const possibleActions = ["up", "down", "left", "right"] as const;
export type Action = typeof possibleActions[number];

export const possibleDirections = ["up", "down", "left", "right"] as const;
export type Direction = typeof possibleDirections[number];
