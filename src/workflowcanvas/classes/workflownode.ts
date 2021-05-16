import { G, Line, Svg, Rect } from "@svgdotjs/svg.js";

import {
  mainBodyHeight,
  mainBodyWidth,
  strokeWidth,
  cellSize,
} from "../constants.js";
import { Point } from "../interfaces.js";
import { IOPortType } from "../types.js";

import { IOPort } from "./ioport.js";

export class WorkflowNode extends G {
  private _svg: Svg;
  private _innerRect: Rect;
  private _outlineRect: Rect;
  private _titleSeparator: Line;
  private _titleElement: HTMLParagraphElement;
  private _mainBody: G;
  private _isSelected: boolean;
  private _inputPorts: Array<IOPort>;
  private _outputPorts: Array<IOPort>;

  constructor(svg: Svg, position: Point) {
    super();

    this._svg = svg;

    // why are two rectangles needed?
    this._innerRect = this._svg
      .rect(mainBodyWidth, mainBodyHeight)
      .radius(strokeWidth)
      .fill("lightgray")
      .opacity(0.2);
    this._outlineRect = this._svg
      .rect(this._innerRect.width(), this._innerRect.height())
      .radius(strokeWidth)
      .fill("none")
      .stroke({ width: strokeWidth, color: this._innerRect.fill() });
    this._titleSeparator = this._svg
      .line(0, cellSize, this._innerRect.width(), cellSize)
      .stroke({ color: this._innerRect.fill(), width: strokeWidth });

    this._mainBody = this._svg.group();
    this._mainBody.add(this._innerRect);
    this._mainBody.add(this._outlineRect);
    this._mainBody.add(this._titleSeparator);

    const titleOffset = 6;
    const titleObject = this._svg
      // @ts-ignore
      .foreignObject(this._innerRect.width(), cellSize)
      .move(titleOffset, 0);
    this._titleElement = document.createElement("p");
    this._titleElement.textContent = "Untitled";
    this._titleElement.style.display = "table-cell"; // For some reason this works
    this._titleElement.style.maxWidth = `${
      this._innerRect.width() - titleOffset * 2
    }px`;
    this._titleElement.style.fontSize = "14px";
    this._titleElement.style.lineHeight = `${cellSize}px`;
    this._titleElement.style.overflow = "hidden";
    this._titleElement.style.textOverflow = "ellipsis";
    this._titleElement.style.whiteSpace = "nowrap";
    titleObject.add(this._titleElement);

    this._svg.add(this);
    this.add(titleObject);
    this.add(this._mainBody);
    this.move(position.x, position.y);

    this._isSelected = false;

    // array containing type ioport
    this._inputPorts = new Array<IOPort>();
    this._outputPorts = new Array<IOPort>();
  }

  public select(): void {
    this._outlineRect.stroke({ color: "black" });
    this._titleSeparator.stroke({ color: "black" });
    this._isSelected = true;
    this.front();
  }

  public unselect(): void {
    this._outlineRect.stroke({ color: "lightgray" });
    this._titleSeparator.stroke({ color: "lightgray" });
    this._isSelected = false;
  }

  public highlight(): void {
    if (this._isSelected) {
      return;
    }
    this._outlineRect.stroke({ color: "darkgray" });
    this._titleSeparator.stroke({ color: "darkgray" });
    this.front();
  }

  public unhighlight(): void {
    if (this._isSelected) {
      return;
    }
    this._outlineRect.stroke({ color: "lightgray" });
    this._titleSeparator.stroke({ color: "lightgray" });
  }

  public addInput(name: string): IOPort {
    const gapSize = 2 * cellSize;
    const inputPort = new IOPort(
      this._svg,
      this,
      IOPortType.Input,
      name,
      gapSize * (1 + this._inputPorts.length)
    );
    this.add(inputPort);
    this._inputPorts.push(inputPort);

    if (
      this._inputPorts.length > 1 &&
      this._inputPorts.length > this._outputPorts.length
    ) {
      this._innerRect.height(this._innerRect.height() + cellSize * 2);
      this._outlineRect.height(this._outlineRect.height() + cellSize * 2);
    }

    return inputPort;
  }

  public addOutput(name: string): IOPort {
    const gapSize = 2 * cellSize;
    const outputPort = new IOPort(
      this._svg,
      this,
      IOPortType.Output,
      name,
      gapSize * (1 + this._outputPorts.length)
    );
    this.add(outputPort);
    this._outputPorts.push(outputPort);

    if (
      this._outputPorts.length > 1 &&
      this._outputPorts.length > this._inputPorts.length
    ) {
      this._innerRect.height(this._innerRect.height() + cellSize * 2);
      this._outlineRect.height(this._outlineRect.height() + cellSize * 2);
    }

    return outputPort;
  }

  public removeInput(inputPort: IOPort) {
    this._inputPorts = this._inputPorts.filter((port) => port !== inputPort);
    inputPort.remove();

    const gapSize = 2 * cellSize;
    let pos = gapSize;
    this._inputPorts.forEach((port) => {
      port.move(port.x(), this._mainBody.y() + pos);
      pos += gapSize;
    });
    if (
      this._mainBody.height() > pos + 1 &&
      this._inputPorts.length >= this._outputPorts.length &&
      this._inputPorts.length !== 0
    ) {
      this._innerRect.height(pos);
      this._outlineRect.height(pos);
    }
  }

  public removeOutput(outputPort: IOPort) {
    this._outputPorts = this._outputPorts.filter((port) => port !== outputPort);
    outputPort.remove();

    const gapSize = 2 * cellSize;
    let pos = gapSize;
    this._outputPorts.forEach((port) => {
      port.move(port.x(), this._mainBody.y() + pos);
      pos += gapSize;
    });
    if (
      this._mainBody.height() > pos + 1 &&
      this._outputPorts.length >= this._inputPorts.length &&
      this._outputPorts.length !== 0
    ) {
      this._innerRect.height(pos);
      this._outlineRect.height(pos);
    }
  }

  get isSelected(): boolean {
    return this._isSelected;
  }

  get mainBody(): G {
    return this._mainBody;
  }

  get inputPorts(): Array<IOPort> {
    return this._inputPorts;
  }

  get outputPorts(): Array<IOPort> {
    return this._outputPorts;
  }
}
