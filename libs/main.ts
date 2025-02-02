
import Map from './gMap';
import Layer from './layer/main';
import Feature from './feature/main';
import Mask from './mask/main';
import Control from './control/main';
import Text from './text/main';
import Marker from './marker/gMarker';
import Util from './gUtil';

import packageJson from '../package.json';

const SDK_VERSION = `${packageJson.version}`; // 版本号

const AILabel = {
  Map,
  Layer,
  Feature,
  Mask,
  Control,
  Text,
  Marker,
  Util,
  version: SDK_VERSION
};

export default AILabel;
