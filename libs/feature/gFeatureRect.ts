import { IAxisOption, IObject, IPoint } from '../gInterface';
import FeatureLayer from '../layer/gLayerFeature';
import { IFeatureStyle, IRectShape } from './gInterface';
import { EFeatureType } from './gEnum';
import Feature from './gFeature';
import Graphic from '../gGraphic';
import CanvasLayer from '../layer/gLayerCanvas';
import Util from '../gUtil';
import { EDirection, EEventType, EXAxisDirection, EYAxisDirection } from '../gEnum';

export default class RectFeature extends Feature {
  // function: constructor
  constructor(id: string, shape: IRectShape, props: IObject = {}, style: IFeatureStyle = {}) {
    super(id, EFeatureType.Rect, props, style);

    this.shape = shape;
  }

  // @override
  // 判断是否捕捉到当前对象，各子类自行实现
  captureWithPoint(point: IPoint): boolean {
    const rectPoints = this.getPoints();
    return Util.MathUtil.pointInPolygon(point, rectPoints);
  }

  // 获取rect矩形的四个点
  getPoints(): IPoint[] {
    const isXAxisLeft = this.layer?.map?.xAxis.direction === EXAxisDirection.Left;
    const isYAxisBottom = this.layer?.map?.yAxis.direction === EYAxisDirection.Bottom;

    const { x: startX, y: startY, width, height } = this.shape as IRectShape;
    const endX = !isXAxisLeft ? (startX + width) : (startX - width);
    const endY = !isYAxisBottom ? (startY - height) : (startY + height);
    // 矩形点
    return [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: endX, y: endY },
      { x: startX, y: endY }
    ];
  }

  // 移动feature
  // @override
  onMove(direction: EDirection) {
    const moveStep = Feature.moveStep; // 每次移动步长

    const { x, y } = this.shape as IRectShape;

    const scale = this.layer?.map?.getScale();
    const isXAxisLeft = this.layer?.map?.xAxis?.direction === EXAxisDirection.Left;
    const isYAxisBottom = this.layer?.map?.yAxis?.direction === EYAxisDirection.Bottom;
    const newStep = moveStep / scale;

    let newPosition = {}; // 新的feature：xy位置信息
    switch (direction) {
      case EDirection.UP: {
        newPosition = { y: isYAxisBottom ? y - newStep : y + newStep };
        break;
      }
      case EDirection.DOWN: {
        newPosition = { y: isYAxisBottom ? y + newStep : y - newStep };
        break;
      }
      case EDirection.LEFT: {
        newPosition = { x: isXAxisLeft ? x + newStep : x - newStep };
        break;
      }
      case EDirection.RIGHT: {
        newPosition = { x: isXAxisLeft ? x - newStep : x + newStep };
        break;
      }
    }

    // 回调函数告知业务层
    const toUpdateShape = { ...this.shape, ...newPosition };
    this.layer?.map?.eventsObServer?.emit(
      EEventType.FeatureUpdated,
      this,
      toUpdateShape,
    )
  }

  // 执行绘制当前
  // @override
  refresh() {
    if (!this.layer?.map) {
      return;
    }

    const dpr = CanvasLayer.dpr;
    const scale = this.layer.map.getScale();

    Graphic.drawRect(
      this.layer.canvasContext,
      this.shape as IRectShape,
      this.style,
      {
        format: (shape: IRectShape) => {
          const { x, y, width, height } = shape;
          const { x: screenX, y: screenY } = this.layer.map.transformGlobalToScreen({ x, y });
          const screenWidth = width * scale;
          const screenHeight = height * scale;
          return {
            x: screenX * dpr,
            y: screenY * dpr,
            width: screenWidth * dpr,
            height: screenHeight * dpr
          }
        }
      }
    );
  }
}
