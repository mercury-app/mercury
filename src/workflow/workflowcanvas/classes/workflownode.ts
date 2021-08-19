import { G, Line, Svg, Rect } from "@svgdotjs/svg.js";
import axios from "axios";

import {
  mainBodyHeight,
  mainBodyWidth,
  strokeWidth,
  cellSize,
} from "../constants.js";
import {
  Point,
  WorkflowNodeAttributes,
  WorkflowNodeJson,
} from "../interfaces.js";
import { IOPortType } from "../types.js";

import { IOPort } from "./ioport.js";

export class WorkflowNode extends G {
  private _svg: Svg;
  private _innerRect: Rect;
  private _outlineRect: Rect;
  private _titleSeparator: Line;
  private _titleElement: HTMLParagraphElement;
  private _kernelStatusElement: Rect;
  private _mainBody: G;
  private _isSelected: boolean;
  private _inputPorts: Array<IOPort>;
  private _outputPorts: Array<IOPort>;
  private _nodeId: string;
  private _attributes: WorkflowNodeAttributes | null;
  private _name: string;
  private _ready: boolean;
  private _ws: WebSocket;

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
      .foreignObject(this._innerRect.width() * (4 / 5), cellSize)
      .move(titleOffset, 0);

    this._titleElement = document.createElement("p");
    this._titleElement.textContent = "";
    this._titleElement.style.display = "table-cell"; // For some reason this works
    this._titleElement.style.maxWidth = `${this._innerRect.width() - titleOffset * 2
      }px`;
    this._titleElement.style.fontSize = "14px";
    this._titleElement.style.lineHeight = `${cellSize}px`;
    this._titleElement.style.overflow = "hidden";
    this._titleElement.style.textOverflow = "ellipsis";
    this._titleElement.style.whiteSpace = "nowrap";
    titleObject.add(this._titleElement);

    this._kernelStatusElement = this._svg
      .rect(this._innerRect.width() * (1 / 5), cellSize)
      .move(this._innerRect.width() * (4 / 5), 0)
      .fill("#E8E8E8");
    // this._kernelStatusElement = document.createElement("div");
    // this._kernelStatusElement.style.display = "table-cell";
    // kernelStatusObject.add(this._kernelStatusElement);

    this._svg.add(this);
    this.add(titleObject);
    this.add(this._kernelStatusElement);
    this.add(this._mainBody);
    this.move(position.x, position.y);

    this._isSelected = false;

    this._inputPorts = new Array<IOPort>();
    this._outputPorts = new Array<IOPort>();

    this._nodeId = "";
    this._attributes = null;

    this._ready = false;
    this._ws = null;
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

  public removeInput(inputPort: IOPort): void {
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

  public removeOutput(outputPort: IOPort): void {
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

  public async updateAttributes(workflowId: string): Promise<void> {
    const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}/nodes/${this._nodeId}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      });
      this._attributes = response.data.data.attributes;
      // eslint-disable-next-line no-console
      console.log("updated node attributes");
    } catch (exception) {
      // eslint-disable-next-line no-console
      console.warn(`error received from GET ${url}: ${exception}`);
    }
  }

  public insertInputsMessageMercuryExtension(): void {
    const message = {
      data: {
        action: "add_input_cell",
        code: this._attributes.notebook_attributes.io.input_code,
      },
    };
    console.log(message)
    const frame = document.getElementById(
      "notebook-iframe"
    ) as HTMLIFrameElement;
    frame.contentWindow.postMessage(
      message,
      this._attributes.notebook_attributes.url
    );
  }

  public insertOutputsMessageMercuryExtension(): void {
    const message = {
      data: {
        action: "add_output_cell",
        code: this._attributes.notebook_attributes.io.output_code,
      },
    };
    const frame = document.getElementById(
      "notebook-iframe"
    ) as HTMLIFrameElement;
    frame.contentWindow.postMessage(
      message,
      this._attributes.notebook_attributes.url
    );
  }

  public saveNotebookMessageMercuryExtension(): void {
    const message = {
      data: {
        action: "save_notebook",
      },
    };
    const frame = document.getElementById(
      "notebook-iframe"
    ) as HTMLIFrameElement;
    frame.contentWindow.postMessage(
      message,
      this._attributes.notebook_attributes.url
    );
  }

  public toJson(): WorkflowNodeJson {
    return {
      position: { x: this.x(), y: this.y() },
      input_ports: this._inputPorts.map((port) => port.toJson()),
      output_ports: this._outputPorts.map((port) => port.toJson()),
      title: this.title,
      id: this._nodeId,
      attributes: this._attributes,
    };
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

  get title(): string {
    return this._titleElement.textContent;
  }

  set title(title: string) {
    this._titleElement.textContent = title;
  }

  get name(): string {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  get kernelStatusElement(): Rect {
    return this._kernelStatusElement;
  }

  get nodeId(): string {
    const nodeId: string = this._nodeId;
    return nodeId;
  }

  set nodeId(nodeId: string) {
    this._nodeId = nodeId;
  }

  get attributes(): WorkflowNodeAttributes {
    return this._attributes;
  }

  set attributes(nodeAttributes: WorkflowNodeAttributes) {
    this._attributes = nodeAttributes;
  }

  get ready(): boolean {
    return this._ready;
  }

  set ready(ready: boolean) {
    const notReadyTitle = "Preparing…";
    if (
      ready &&
      this.title === notReadyTitle) {
      if (this._attributes !== null) {
        if (this.attributes.notebook_attributes.jupyter_server)
          this.title = this._name;
        else
          this.title = notReadyTitle;
      }
    } else if (!ready) {
      this.title = notReadyTitle;
    }
    this._ready = ready;
  }

  set ws(websocket: WebSocket) {
    this._ws = websocket;
  }
}
