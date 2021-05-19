import { Runner, Box } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";

export interface Point {
  x: number;
  y: number;
}

export interface AnimatedElement {
  // method
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

// what is event here
export interface SvgDragEvent extends Event {
  detail: {
    handler: DragHandler;
    box: Box;
    event: MouseEvent;
  };
}

// what is mouseevent?
export interface SvgMouseMoveEvent extends MouseEvent {
  layerX: number;
  layerY: number;
}
