import { G, Svg, Rect } from "@svgdotjs/svg.js";

import {
  mainBodyWidth,
  strokeWidth,
  cellSize,
  portWidth,
  portHeight,
} from "../constants.js";
import { Point } from "../interfaces.js";
import { IOPortType } from "../types.js";

import { WorkflowNode } from "./workflownode.js";

export class IOPort extends G {
  private _workflowNode: WorkflowNode;
  private _portType: IOPortType;
  private _mainRect: Rect;
  private _isSelected: boolean;
  private _nameElement: HTMLParagraphElement;
  private _name: string;

  //for initialising of properties
  constructor(
    svg: Svg,
    workflowNode: WorkflowNode,
    portType: IOPortType,
    name: string,
    yPosition: number
  ) {
    super();

    this._workflowNode = workflowNode;
    this._portType = portType;

    const fill = "lightgray";
    this._mainRect = svg
      .rect(portWidth + mainBodyWidth * 0.4, portHeight)
      .radius(strokeWidth)
      .fill("white")
      .stroke({ width: strokeWidth, color: fill });

    this._name = name;
    const nameOffset = 6;
    const nameObjectSize = this._mainRect.width() - nameOffset * 2;
    const nameObject = svg
      // @ts-ignore
      .foreignObject(this._mainRect.width(), cellSize)
      .move(nameOffset, 0);
    nameObject.width(nameObjectSize);
    this._nameElement = document.createElement("p");
    this._nameElement.textContent = this._name;
    this._nameElement.style.display = "table-cell"; // For some reason this works
    this._nameElement.style.width = `${nameObjectSize}px`;
    this._nameElement.style.maxWidth = `${nameObjectSize}px`;
    this._nameElement.style.fontSize = "12px";
    this._nameElement.style.lineHeight = `${cellSize}px`;
    this._nameElement.style.overflow = "hidden";
    this._nameElement.style.textOverflow = "ellipsis";
    this._nameElement.style.whiteSpace = "nowrap";
    nameObject.add(this._nameElement);

    const layerRect = svg
      .rect(portWidth + mainBodyWidth * 0.4, portHeight)
      .opacity(0.0);

    svg.add(this); //add object created to svg object
    this.add(this._mainRect);
    this.add(nameObject);
    this.add(layerRect); // why is this layer rect being added?

    if (this._portType === IOPortType.Input) {
      this.move(
        this._workflowNode.mainBody.x() - portWidth,
        this._workflowNode.mainBody.y() + yPosition
      );
    } else if (this._portType === IOPortType.Output) {
      this._nameElement.style.textAlign = "right";
      this.move(
        this._workflowNode.mainBody.x() +
          this._workflowNode.mainBody.width() -
          this._mainRect.width() +
          portWidth,
        this._workflowNode.mainBody.y() + yPosition
      );
    }

    this._isSelected = false;
  }

  public select(): void {
    this.children().forEach((element) => {
      element.stroke({ color: "black" });
    });
    this._isSelected = true;
  }

  public unselect(): void {
    this.children().forEach((element) => {
      element.stroke({ color: "lightgray" });
    });
    this._isSelected = false;
  }

  public highlight(): void {
    if (this._isSelected) {
      return;
    }
    this.children().forEach((element) => {
      element.stroke({ color: "darkgray" });
    });
  }

  public unhighlight(): void {
    if (this._isSelected) {
      return;
    }
    this.children().forEach((element) => {
      element.stroke({ color: "lightgray" });
    });
  }

  get workflowNode(): WorkflowNode {
    return this._workflowNode;
  }

  // getter
  get portType(): IOPortType {
    return this._portType;
  }

  get isSelected(): boolean {
    return this._isSelected;
  }

  get coordinate(): Point {
    if (this._portType === IOPortType.Input) {
      return { x: this.x(), y: this.y() + this.height() / 2 };
    } else if (this._portType === IOPortType.Output) {
      return { x: this.x() + this.width(), y: this.y() + this.height() / 2 };
    }
  }

  get topOffset(): number {
    return this.coordinate.y - this._workflowNode.mainBody.y();
  }

  get bottomOffset(): number {
    return (
      this._workflowNode.mainBody.y() +
      this._workflowNode.mainBody.height() -
      this.coordinate.y
    );
  }

  get name(): string {
    return this._name;
  }
}
