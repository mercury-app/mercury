import { Runner, Box } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import { IOPortType } from "./types";

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
    workflow_kernel_state: string | null;
    jupyter_server: boolean;
    url: string;
    io: NotebookIO;
  };
  input: Array<string>;
  output: Array<string>;
}

export interface WorkflowCanvasJson extends Object {
  nodes: Array<WorkflowNodeJson>;
  connectors: Array<WorkflowConnectorJson>;
}

export interface WorkflowNodeJson extends Object {
  position: Point;
  input_ports: Array<IOPortJson>;
  output_ports: Array<IOPortJson>;
  title: string;
  id: string;
  attributes: WorkflowNodeAttributes;
}

export interface WorkflowConnectorJson extends Object {
  src: IOPortJson;
  dest: IOPortJson;
}

export interface IOPortJson extends Object {
  node_id: string;
  port_type: IOPortType;
  port_name: string;
}
