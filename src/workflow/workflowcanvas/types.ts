import { Point } from "./interfaces.js";

export enum IOPortType {
  Input,
  Output,
}

export type Delta = Point;

export type WorkflowAttributes = Record<string, unknown>;
