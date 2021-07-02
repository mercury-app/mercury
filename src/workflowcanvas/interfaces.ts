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

export interface NotebookIO {
  input_code: string;
  output_code: string;
}

export interface WorkflowNodeAttributes extends Object {
  container_attributes: {
    id: string;
    state: string;
  };
  image_attributes: {
    name: string;
    state: string | null;
    tag: string;
  };
  notebook_attributes: {
    exit_code: number;
    state: string | null;
    kernel_state: string | null;
    jupyter_server: boolean;
    url: string;
    io: NotebookIO
  }
  input: Array<string>;
  output: Array<string>;
}
