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
    },

    constrainPos: function (pos) {
      this.check(pos);

      pos.x = limitCheck.x === -1 ?
        limitCheck.limits.minX : limitCheck.x === 1 ?
        limitCheck.limits.maxX : pos.x;

      pos.y = limitCheck.y === -1 ?
        limitCheck.limits.minY : limitCheck.y === 1 ?
        limitCheck.limits.maxY : pos.y;

      return pos;
    }

  };

})

.directive('constrainResize', function ($window, Limit, ModifiedNouns) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      var pos = {};

      var parentData, curLevel;

      angular.element($window).on('resize', function () {
        parentData = element[0].getBoundingClientRect();
        curLevel = ModifiedNouns.getCurLevel();

        Limit.setXY(curLevel.size, parentData);

        pos.x = curLevel.position.left;
        pos.y = curLevel.position.top;

        pos = Limit.constrainPos(pos);

        ModifiedNouns.positionLevel(curLevel, pos.x, pos.y);
      });
    }
  };
});