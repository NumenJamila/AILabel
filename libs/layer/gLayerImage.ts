import events from 'events/events';
import _forEach from 'lodash/forEach';
import _assign from 'lodash/assign';
import _get from 'lodash/get';

import Map from '../gMap';
import { IObject, IPoint } from '../gInterface';
import Graphic from '../gGraphic';

import { ILayerStyle, IImageInfo, IGridInfo, IGridItemInfo } from './gInterface';
import CanvasLayer from './gLayerCanvas';
import { ELayerImageEventType, ELayerType } from './gEnum';
import { EXAxisDirection, EYAxisDirection } from '../gEnum';

export default class ImageLayer extends CanvasLayer {
  /**
   * props: image可选初始化配置项
   * defaultImageInfo: 默认配置项
   * image: userImage merge defaultImageInfo
  */
  static defaultImageInfo: IImageInfo = {
    src: '',
    width: 0,
    height: 0,
    position: { x: 0, y: 0 }, // 默认起始位置
    crossOrigin: false,
    grid: {
      columns: [],
      rows: []
    }
  }
  public imageInfo: IImageInfo
  public image: HTMLImageElement
  public imageSuccess: boolean = false // 标识图片是否是有效图片

  public position: IPoint // 图片当前的位置

  public grid: IGridInfo // 图片网格

  // events
  public eventsObServer: events.EventEmitter

  // function: constructor
  constructor(id: string, image: IImageInfo, props: IObject = {}, style: ILayerStyle = {}) {
    super(id, ELayerType.Image, props, style);

    // 事件监听实例添加
    this.eventsObServer = new events.EventEmitter();

    this.imageInfo = _assign({}, ImageLayer.defaultImageInfo, image);
    this.position = this.imageInfo.position;
    this.grid = this.imageInfo.grid;
    // this.updateImage();
  }

  // 更新图片信息
  updateImageInfo(image: IImageInfo) {
    this.imageInfo = _assign({}, this.imageInfo, image);
    image.position && (this.position = this.imageInfo.position);
    image.src && this.updateImage();
    this.refresh();
  }

  // 更新image对象
  updateImage() {
    if (this.imageInfo.src) {
      this.imageSuccess = false;
      // 首先执行loadStart回调
      this.eventsObServer.emit(
        ELayerImageEventType.LoadStart,
        this.imageInfo.src,
        this
      );
      this.image = new Image();

      if (this.imageInfo.crossOrigin) {
        this.image.setAttribute('crossOrigin', 'anonymous');
      }
      else {
        this.image.removeAttribute('crossOrigin');
      }

      this.image.src = this.imageInfo.src;
      this.image.onload = () => {
        this.imageInfo.width = this.image.width
        this.imageInfo.height = this.image.height
        // this.map.imageInfo = {
        //     width:this.image.width,
        //     height: this.image.height
        //   }
        console.log(this.imageInfo)
        this.map.center = {
          x: this.image.width / 2,
          y: this.image.height / 2
        }
        if (this.image.width > this.image.height) {
          this.map.zoom = this.image.width * 1.1
        } else {
          this.map.zoom = (this.map.size.width / this.map.size.height) * this.image.height * 1.1
        }
        this.imageSuccess = true;
        this.map && this.refresh();
        this.eventsObServer.emit(
          ELayerImageEventType.LoadEnd,
          this.imageInfo.src,
          this
        );
      };
      this.image.onerror = () => {
        this.imageSuccess = false;
        console.error('image src: ' + this.imageInfo.src + ' load error');
        this.eventsObServer.emit(
          ELayerImageEventType.LoadError,
          this.imageInfo.src,
          this
        );
      }
    }
  }

  // 更新grid网格
  updateGrid(gridInfo: IGridInfo) {
    this.grid = gridInfo;

    this.refresh();
  }

  // @override
  onAdd(map: Map) {
    super.onAdd(map);

    this.updateImage();
    this.refresh();
  }

  // 绘制image信息
  drawImage() {
    // 执行坐标转换
    const { x: screenX, y: screenY } = this.map.transformGlobalToScreen(this.position);

    const dpr = CanvasLayer.dpr;
    const scale = this.map.getScale();
    const { width, height } = this.imageInfo;
    const screenWidth = width * scale;
    const screenHeight = height * scale;

    (this.image && this.imageSuccess) && Graphic.drawImage(
      this.canvasContext,
      {
        image: this.image,
        x: screenX * dpr,
        y: screenY * dpr,
        width: screenWidth * dpr,
        height: screenHeight * dpr
      },
      {}
    );
  }

  // 绘制grid信息
  drawGrid() {
    const { width, height } = this.imageInfo;
    const { x: startX, y: startY } = this.position;
    const dpr = CanvasLayer.dpr;

    const isXAxisRight = this.map.xAxis.direction === EXAxisDirection.Right;
    const isYAxisTop = this.map.yAxis.direction === EYAxisDirection.Top;

    const columns = _get(this.grid, 'columns', []);
    const rows = _get(this.grid, 'rows', []);

    // 绘制列
    const columnsCount = columns.length;
    const columnItemWidth = width / (columnsCount + 1);
    _forEach(columns, (column: IGridItemInfo, index: number) => {
      const { color: lineColor = '#333', width: lineWidth = 1 } = column || {};
      const totalItemWidth = (index + 1) * columnItemWidth;
      const itemX = isXAxisRight ? (startX + totalItemWidth) : (startX - totalItemWidth);

      const itemTopY = startY;
      const itemBottomY = isYAxisTop ? (startY - height) : (startY + height);

      const startPoint = this.map.transformGlobalToScreen({ x: itemX, y: itemTopY });
      const endPoint = this.map.transformGlobalToScreen({ x: itemX, y: itemBottomY });

      Graphic.drawLine(
        this.canvasContext,
        {
          start: { x: startPoint.x * dpr, y: startPoint.y * dpr },
          end: { x: endPoint.x * dpr, y: endPoint.y * dpr }
        },
        {
          strokeStyle: lineColor,
          lineWidth: lineWidth
        }
      );
    });

    // 绘制行
    const rowsCount = rows.length;
    const rowItemHeight = height / (rowsCount + 1);
    _forEach(rows, (row: IGridItemInfo, index: number) => {
      const { color: lineColor = '#333', width: lineWidth = 1 } = row || {};
      const totalItemHeight = (index + 1) * rowItemHeight;
      const itemY = isYAxisTop ? (startY - totalItemHeight) : (startY + totalItemHeight);

      const itemLeftX = startX;
      const itemRightX = isXAxisRight ? (startX + width) : (startX - width);

      const startPoint = this.map.transformGlobalToScreen({ x: itemLeftX, y: itemY });
      const endPoint = this.map.transformGlobalToScreen({ x: itemRightX, y: itemY });

      Graphic.drawLine(
        this.canvasContext,
        {
          start: { x: startPoint.x * dpr, y: startPoint.y * dpr },
          end: { x: endPoint.x * dpr, y: endPoint.y * dpr }
        },
        {
          strokeStyle: lineColor,
          lineWidth: lineWidth
        }
      );
    });
  }

  // 用户事件添加
  public events: IObject = {
    on: (eventType: ELayerImageEventType, callback: Function) => {
      this.eventsObServer.on(eventType, callback);
    }
  }

  // @override
  refresh() {
    super.refresh();
    this.drawImage();
    this.drawGrid();
  }
}
