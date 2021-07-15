import { G, Path, Svg } from "@svgdotjs/svg.js";

import { strokeWidth, cellSize, clamp } from "../constants.js";
import { Point, WorkflowConnectorJson } from "../interfaces.js";
import { IOPort } from "./ioport.js";

export class WorkflowConnector extends G {
  private _mainPath: Path;
  private _overlayPath: Path;
  private _isSelected: boolean;
  private _connectorId: string;
  private _src: IOPort;
  private _dest: IOPort;

  constructor(svg: Svg, start: Point) {
    super();

    this._mainPath = svg.path(`M${start.x} ${start.y}`).fill("none");
    this._mainPath.stroke({
      color: "black",
      width: strokeWidth,
    });
    this.add(this._mainPath);

    this._overlayPath = svg
      .path(`M${start.x} ${start.y}`)
      .fill("none")
      .opacity(0);
    this._overlayPath.stroke({ color: "black", width: strokeWidth * 13 });
    this.add(this._overlayPath);

    this._isSelected = false;
    this._connectorId = "";
    this._src = null;
    this._dest = null;

    svg.add(this);
  }

  private _drawPath(
    path: Path,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    startTopOffset = 0,
    startBottomOffset = 0,
    endTopOffset = 0,
    endBottomOffset = 0
  ) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (endX >= startX) {
      let curveDelta = cellSize / 2;
      curveDelta = clamp(curveDelta, 0, Math.abs(deltaX) / 2);
      curveDelta = clamp(curveDelta, 0, Math.abs(deltaY) / 2);

      // Category I => regular two-bend connector from start to end
      // 1. move a bit right
      // 2. curve up/down
      // 3. move a bit up/down
      // 4. curve right
      // 5. move right to the endX
      path.plot(
        `M ${startX} ${startY} ` +
          `H ${startX + deltaX * 0.5 - curveDelta} ` +
          `Q ${startX + deltaX * 0.5} ${startY} ${startX + deltaX * 0.5} ${
            startY + curveDelta * Math.sign(deltaY)
          } ` +
          `V ${endY - curveDelta * Math.sign(deltaY)} ` +
          `Q ${startX + deltaX * 0.5} ${endY} ${
            startX + deltaX * 0.5 + curveDelta
          } ${endY} ` +
          `H ${endX}`
      );
    } else if (
      endX < startX &&
      (startY + startBottomOffset + cellSize <=
        endY - endTopOffset - cellSize ||
        startY - startTopOffset - cellSize >= endY + endBottomOffset + cellSize)
    ) {
      const curveDelta = cellSize / 2;
      let midPoint = (startY + endY) / 2;
      if (startY + startBottomOffset + cellSize * 2 <= endY) {
        // Category IIa => four-bend connector going below
        const top = endY - endTopOffset;
        const bottom = startY + startBottomOffset;
        midPoint = (top + bottom) / 2;
      } else {
        // Category IIb => four-bend connector going above
        const top = startY - startTopOffset;
        const bottom = endY + endBottomOffset;
        midPoint = (top + bottom) / 2;
      }

      // 1. move right by curveDelta
      // 2. curve up/down
      // 3. move up/down about half the distance between the nodes' bodies
      // 4. curve left
      // 5. move left to endX - curveDelta
      // 6. curve up/down
      // 7. move up/down towards endY
      // 8. curve right
      // 9. move right to the endX
      path.plot(
        `M ${startX} ${startY} ` +
          `H ${startX + curveDelta} ` +
          `Q ${startX + 2 * curveDelta} ${startY} ${startX + 2 * curveDelta} ${
            startY + curveDelta * Math.sign(deltaY)
          } ` +
          `V ${midPoint - curveDelta * Math.sign(deltaY)} ` +
          `Q ${startX + 2 * curveDelta} ${midPoint} ${
            startX + curveDelta
          } ${midPoint} ` +
          `H ${endX - curveDelta} ` +
          `Q ${endX - 2 * curveDelta} ${midPoint} ${endX - 2 * curveDelta} ${
            midPoint + curveDelta * Math.sign(deltaY)
          } ` +
          `V ${endY - curveDelta * Math.sign(deltaY)} ` +
          `Q ${endX - 2 * curveDelta} ${endY} ${endX - curveDelta} ${endY} ` +
          `H ${endX}`
      );
    } else {
      const curveDelta = cellSize / 2;
      const startTop = startY - startTopOffset;
      const endTop = endY - endTopOffset;
      const top = Math.min(startTop, endTop);

      // Category III => four-bend loop-over connector
      // 1. move right by curveDelta
      // 2. curve up
      // 3. move up to higher among top of nodes' bodies + curveDelta
      // 4. curve left
      // 5. move left to endX - curveDelta
      // 6. curve down
      // 7. move down towards endY
      // 8. curve right
      // 9. move right to the endX
      path.plot(
        `M ${startX} ${startY} ` +
          `H ${startX + curveDelta} ` +
          `Q ${startX + 2 * curveDelta} ${startY} ${startX + 2 * curveDelta} ${
            startY - curveDelta
          } ` +
          `V ${top - curveDelta} ` +
          `Q ${startX + 2 * curveDelta} ${top - 2 * curveDelta} ${
            startX + curveDelta
          } ${top - 2 * curveDelta} ` +
          `H ${endX - curveDelta} ` +
          `Q ${endX - 2 * curveDelta} ${top - 2 * curveDelta} ${
            endX - 2 * curveDelta
          } ${top - curveDelta} ` +
          `V ${endY - curveDelta} ` +
          `Q ${endX - 2 * curveDelta} ${endY} ${endX - curveDelta} ${endY} ` +
          `H ${endX}`
      );
    }
  }

  public redraw(
    start: Point,
    end: Point,
    startTopOffset = 0,
    startBottomOffset = 0,
    endTopOffset = 0,
    endBottomOffset = 0
  ): void {
    this._drawPath(
      this._mainPath,
      start.x,
      start.y,
      end.x,
      end.y,
      startTopOffset,
      startBottomOffset,
      endTopOffset,
      endBottomOffset
    );
    this._drawPath(
      this._overlayPath,
      start.x,
      start.y,
      end.x,
      end.y,
      startTopOffset,
      startBottomOffset,
      endTopOffset,
      endBottomOffset
    );
  }

  public select(): void {
    this._mainPath.stroke({ color: "black" });
    this._isSelected = true;
    this.front();
  }

  public unselect(): void {
    this._mainPath.stroke({ color: "lightgray" });
    this._isSelected = false;
  }

  public highlight(): void {
    if (this._isSelected) {
      return;
    }
    this._mainPath.stroke({ color: "darkgray" });
    this.front();
  }

  public unhighlight(): void {
    if (this._isSelected) {
      return;
    }
    this._mainPath.stroke({ color: "lightgray" });
  }

  public setSrcAndDest(src: IOPort, dest: IOPort): void {
    this._src = src;
    this._dest = dest;
    if (this._src && this._dest) {
      const p1 = this._src.coordinate;
      const p2 = this._dest.coordinate;
      const startTopOffset = this._src.topOffset;
      const startBottomOffset = this._src.bottomOffset;
      const endTopOffset = this._dest.topOffset;
      const endBottomOffset = this._dest.bottomOffset;
      this.redraw(
        p1,
        p2,
        startTopOffset,
        startBottomOffset,
        endTopOffset,
        endBottomOffset
      );
    }
  }

  public toJson(): WorkflowConnectorJson {
    return {
      id: this._connectorId,
      src: this._src ? this._src.toJson() : null,
      dest: this._dest ? this._dest.toJson() : null,
    };
  }

  get isSelected(): boolean {
    return this._isSelected;
  }

  get connectorId(): string {
    return this._connectorId;
  }

  set connectorId(connectorId: string) {
    this._connectorId = connectorId;
  }
}
