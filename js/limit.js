'use strict';

angular.module('modifiedNouns.limit', [])

.factory('Limit', function () {
  var limits = {};
  var limitCheck = { limits: limits };

  return {
    setXY: function (startData, parentData) {
      limits.maxX = parentData.left;
      limits.minX = parentData.width - startData.width;

      limits.maxY = parentData.top;
      limits.minY = parentData.height - startData.height;
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