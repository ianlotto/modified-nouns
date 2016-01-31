'use strict';

angular.module('modifiedNouns.limit', [])

.factory('Limit', function () {
  var orderedLimits = [];
  var limits = {};
  var limitCheck = { limits: limits };

  var widerParent, tallerParent;

  return {
    setXY: function (startData, parentData) {
      widerParent = parentData.width > startData.width;
      tallerParent = parentData.height > startData.height;

      orderedLimits[0] = parentData.left;
      orderedLimits[1] = parentData.width - startData.width;

      limits.minX = widerParent ? orderedLimits[0] : orderedLimits[1];
      limits.maxX = widerParent ? orderedLimits[1] : orderedLimits[0];

      orderedLimits[2] = parentData.top;
      orderedLimits[3] = parentData.height - startData.height;

      limits.minY = tallerParent ? orderedLimits[2] : orderedLimits[3];
      limits.maxY = tallerParent ? orderedLimits[3] : orderedLimits[2];
    },

    setZ: function (max, min) {
      limits.maxZ = max;
      limits.minZ = min;
    },

    check: function (pos) {
      limitCheck.x = pos.x < limits.minX ? -1 : pos.x > limits.maxX ? 1 : 0;
      limitCheck.y = pos.y < limits.minY ? -1 : pos.y > limits.maxY ? 1 : 0;
      limitCheck.z = pos.z < limits.minZ ? -1 : pos.z > limits.maxZ ? 1 : 0;

      return limitCheck;
    }
  };

});