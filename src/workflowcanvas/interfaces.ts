import { Runner, Box } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";

export interface Point {
  x: number;
  y: number;
}

export interface AnimatedElement {
  animate: (args: {
    duration?: number;
    delay?: number;
    when?: string;
    swing?: boolean;
    ease?: string;
    times?: number;
    wait?: number;
  }) => Runner;
}

export interface DragHandler {
  startDrag: () => void;
  drag: () => void;
  endDrag: () => void;
  move: (x: number, y: number) => void;
  el: AnimatedElement;
}

export interface SvgDragEvent extends Event {
  detail: {
    handler: DragHandler;
    box: Box;
    event: MouseEvent;
  };
}

export interface SvgMouseMoveEvent extends MouseEvent {
  layerX: number;
  layerY: number;
}

export interface WorkflowNodeAttributes extends Object {
  container_id: string;
  container_state: {
    Dead: boolean;
    Error: string;
    ExitCode: number;
    FinishedAt: string;
    OOMKilled: boolean;
    Paused: boolean;
    Pid: number;
    Restarting: boolean;
    Running: boolean;
    StartedAt: string;
    Status: string;
  };
  docker_img_name: string;
  docker_img_tag: string;
  input: Array<string>;
  notebook_url: string;
  output: Array<string>;
}
