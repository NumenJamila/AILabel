import _forEach from 'lodash/forEach';
import _cloneDeep from 'lodash/cloneDeep';
import _isFunction from 'lodash/isFunction';

import Text from '../text/gText';
import Line from '../feature/gFeatureLine';

import { IObject, IPoint } from '../gInterface';
import { ILayerStyle } from './gInterface';
import { ELayerType } from './gEnum';
import CanvasLayer from './gLayerCanvas';
import { IFeatureStyle, ILineShape } from '../feature/gInterface';
import Feature from '../feature/gFeature';
import { ITextInfo } from '../text/gInterface';
import { EXAxisDirection, EYAxisDirection } from '../gEnum';

export default class SupportLayer extends CanvasLayer {
  public supports: Array<Feature | Text> = [] // 当前supportLayer中所有的supports

  // 默认text文本的样式
  public static defaultTextStyle: IFeatureStyle = {
    fillStyle: '#FFFFFF',
    strokeStyle: '#D2691E',
    background: true,
    globalAlpha: 1,
    fontColor: '#333',
    font: 'normal 10px Arial',
    textBaseline: 'top'
  }

  // 默认feature的样式
  public static defaultFeatureStyle: IFeatureStyle = {
    fillStyle: '#FFFFFF',
    strokeStyle: '#D2691E',
    background: true,
    globalAlpha: .3,
    fontColor: '#333',
    font: 'normal 10px Arial',
    textBaseline: 'top'
  }

  // function: constructor
  constructor(id: string, props: IObject = {}, style: ILayerStyle = {}) {
    super(id, ELayerType.Support, props, style);
  }

  // 添加feature至当前FeatureLayer中
  addSupports(feature: Feature | Text, option?: IObject) {
    const { clear = false } = option || {};
    clear && this.removeAllSupports();

    feature.onAdd(this);
    this.supports.push(feature);
  }

  // 添加文本
  addText(textInfo: ITextInfo, option?: IObject) {
    const { style, clear = true } = option || {};

    const text = new Text(
      `${+new Date()}`, // id
      { ...textInfo, offset: { x: 5, y: -5 } }, // shape
      {}, // props
      (style || SupportLayer.defaultTextStyle) // style
    );
    this.addSupports(text, { clear });
  }

  // 添加line
  addLineFeature(shape: ILineShape, option: IObject = {}) {
    const { style, clear = true } = option;
    const feature = new Line(
      `${+new Date()}`, // id
      shape, // shape
      {}, // props
      (style || SupportLayer.defaultFeatureStyle) // style
    );
    this.addSupports(feature, { clear });
  }

  // 绘制全屏十字丝
  addCrosshair(pointInfo: IPoint, option: IObject = {}) {
    const { x: mouseGlobalX, y: mouseGlobalY } = pointInfo;
    const { x, y, width, height } = this.map.getBounds();

    // 水平线
    const horizontalLineStartPoint = { x, y: mouseGlobalY };
    const horizontalLineEndPoint = { x: x + width, y: mouseGlobalY };

    // 垂直线
    const verticalLineStartPoint = { x: mouseGlobalX, y };
    const verticalLineEndPoint = { x: mouseGlobalX, y: y - height };

    this.addLineFeature({ start: horizontalLineStartPoint, end: horizontalLineEndPoint }, { clear: true });
    this.addLineFeature({ start: verticalLineStartPoint, end: verticalLineEndPoint }, { clear: false });
  }

  // 清空所有子对象
  removeAllSupports() {
    this.supports = [];
    this.clear();
  }

  // @override
  refresh() {
    super.refresh();
    _forEach(this.supports, (support: Feature | Text) => support.refresh());
  }
}
