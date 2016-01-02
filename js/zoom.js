'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom', function ($window, $timeout, Limit, Input, ModifiedNouns) {

  var ZOOM_FACTOR = 100;
  var zooming = false;

  var levels = ModifiedNouns.levels;
  var size = {};
  var offset = {};

  var wheelTouch, prevLevel, level, levelSwitch, position, cancel;

  var maxZ = 1;
  var minZ = $window.Math.pow(2, -ModifiedNouns.levels.length);

  while($window.Math.round(minZ) !== minZ) {
    maxZ *= 10;
    minZ *= 10;
  }

  var pos = { z: maxZ };

  Limit.setZ(maxZ, minZ);

  var hideElement = function (element) {
    element.css('display', 'none');
  };

  var setZoomState = function (element, state) {
    element[state ? 'addClass' : 'removeClass']('zooming');
    zooming = state;
  };

  var getScaledSize = function (size, z) {
    size.width = ModifiedNouns.FULL_SIZE.width * z;
    size.height = ModifiedNouns.FULL_SIZE.height * z;

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

    pos.z = $window.Math.round(pos.z * 1000) / 1000;

    return pos;
  };

  var findLevel = function (z, level) {
    if(!level || !inRange(z, level.range)) { // Check the current level first
      for (var i = 0; i < levels.length; i++) {
        level = levels[i];

        if(inRange(z, level.range)) {
          break;
        }
      }
    }

    return level;
  };

  var inRange = function (z, range) {
    return !!(z <= range.max && z >= range.min);
  };

  var zoom = function (wheelTouch) {
    pos.z += wheelTouch.dir / ZOOM_FACTOR;
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