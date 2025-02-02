import BaseFeature from './gFeature';
import Point from './gFeaturePoint';
import Circle from './gFeatureCircle';
import Line from './gFeatureLine';
import Polyline from './gFeaturePolyline';
import Rect from './gFeatureRect';
import Polygon from './gFeaturePolygon';
import Arrow from './gFeatureArrow';

const Feature = {
  Base: BaseFeature,
  Point,
  Circle,
  Line,
  Polyline,
  Rect,
  Polygon,
  Arrow
};

export default Feature;
