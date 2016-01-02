'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom', function ($window, $timeout, Limit, Input, ModifiedNouns) {

  var zooming = false;

  var maxZ = 1;
  var minZ = $window.Math.pow(2, -ModifiedNouns.levels.length);
  var scalePower = 0;

  while($window.Math.round(minZ) !== minZ) {
    maxZ *= 10;
    minZ *= 10;
    scalePower += 1;
  }

  Limit.setZ(maxZ, minZ);

  var baseIncrement = $window.Math.pow(10, scalePower - 2);

  var levels = ModifiedNouns.levels;
  var scaledRanges = new $window.Array(ModifiedNouns.levels.length);

  var pos = { z: maxZ };
  var size = {};
  var offset = {};

  var wheelTouch, prevLevel, level, levelSwitch, position, cancel;

  var hideElement = function (element) {
    element.css('display', 'none');
  };

  var setZoomState = function (element, state) {
    element[state ? 'addClass' : 'removeClass']('zooming');
    zooming = state;
  };

  var getScaledSize = function (size, z) {
    size.width = ModifiedNouns.FULL_SIZE.width * z / maxZ;
    size.height = ModifiedNouns.FULL_SIZE.height * z / maxZ;

    return size;
  };

  var getScaledPosition = function (level, size, center) {
    offset.x = (center.x - level.position.left);
    offset.y = (center.y - level.position.top);

    offset.newX = size.width * (offset.x / level.size.width);
    offset.newY = size.height * (offset.y / level.size.height);

    return {
      x: level.position.left - (offset.newX - offset.x),
      y: level.position.top - (offset.newY - offset.y)
    };
  };

  var constrainScale = function (pos, checkResult) {
    pos.z = checkResult.z === -1 ?
      checkResult.limits.minZ : checkResult.z === 1 ?
      checkResult.limits.maxZ : pos.z;

    return pos;
  };

  var findLevel = function (z, level) {
    // Check the current level first
    if(!level || !inRange(z, scaledRanges[level.order])) {
      for (var i = 0; i < levels.length; i++) {
        // Lazy-build scaled range
        if(!scaledRanges[i]) {
          buildScaledRange(i);
        }

        if(inRange(z, scaledRanges[i])) {
          level = levels[i];
          break;
        }
      }
    }

    return level;
  };

  var inRange = function (z, range) {
    return !!(z <= range.max && z >= range.min);
  };

  var buildScaledRange = function (i) {
    // get increments of each range
    scaledRanges[i] = {};
    scaledRanges[i].max = levels[i].range.max * maxZ;
    scaledRanges[i].min = levels[i].range.min * maxZ;

    return scaledRanges[i];
  };

  var zoom = function (wheelTouch) {
    pos.z += wheelTouch.dir * baseIncrement;
    pos = constrainScale(pos, Limit.check(pos));

    prevLevel = level;
    level = findLevel(pos.z, level);

    levelSwitch = !!prevLevel && prevLevel !== level;

    size = getScaledSize(size, pos.z);

    // When switching levels, use prevLevel for calc to ensure smooth transition
    position = getScaledPosition(
      levelSwitch ? prevLevel : level, size, wheelTouch
    );

    ModifiedNouns.scaleLevel(level.element, size, position);

    if(levelSwitch) {
      hideElement(prevLevel.element);
    }
  };

  return {
    bind: function (element) {
      element.on('wheel', function (e) {
        e.preventDefault();

        wheelTouch = Input.getWheelTouch(e);

        if(!!wheelTouch.dir && element[0] !== e.target) {

          if(!zooming) {
            setZoomState(element, true);
          }

          if(!!cancel) {
            $timeout.cancel(cancel);
          }

          cancel = $timeout(setZoomState, 200, false, element, false);

          zoom(wheelTouch);
        }
      });
    }
  };

})

.directive('zoom', function (Zoom) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      Zoom.bind(element);
    }
  };
});