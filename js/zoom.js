'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom',
  function ($window, $timeout, ASSET_DATA, Limit, Input, ModifiedNouns) {

    var ZOOM_FACTOR = 200;
    var zooming = false;

    var levels = ModifiedNouns.levels;
    var pos = { z: 1 };
    var size = {};
    var offset = {};

    var wheelTouch, prevLevel, level, position, elRect, cancel;

    var scaleElement = function (element, size, position) {
      element.css({
        display: 'block',
        width:  size.width + 'px',
        height: size.height + 'px'
      });

      ModifiedNouns.positionLevel(element, position.x, position.y);
    };

    var hideElement = function (element) {
      element.css('display', 'none');
    };

    var setZoomState = function (element, state) {
      element[state ? 'addClass' : 'removeClass']('zooming');
      zooming = state;
    };

    var getScaledSize = function (size, z) {
      size.width = ASSET_DATA.fullSize.width * z;
      size.height = ASSET_DATA.fullSize.height * z;

      return size;
    };

    var getScaledPosition = function (element, size, position) {
      elRect = element[0].getBoundingClientRect();

      offset.x = (position.x - elRect.left);
      offset.y = (position.y - elRect.top);

      offset.newX = size.width * (offset.x / elRect.width);
      offset.newY = size.height * (offset.y / elRect.height);

      return {
        x: elRect.left - (offset.newX - offset.x),
        y: elRect.top - (offset.newY - offset.y)
      };
    };

    var constrainScale = function (pos, checkResult) {
      pos.z = checkResult.z === -1 ?
        checkResult.limits.minZ : checkResult.z === 1 ?
        checkResult.limits.maxZ : pos.z;

      return pos;
    };

    var findLevel = function (z, levels) {
      for (var i = 0; i < levels.length; i++) {
        level = levels[i];

        if(inRange(z, level.range)) {
          break;
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
      level = findLevel(pos.z, levels);

      size = getScaledSize(size, pos.z);
      position = getScaledPosition(level.element, size, wheelTouch);

      scaleElement(level.element, size, position);

      if(!!prevLevel && prevLevel.element !== level.element) {
        hideElement(prevLevel.element);
      }
    };

    Limit.setZ(1, $window.Math.pow(2, -ASSET_DATA.img.levels));

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

  }
)

.directive('zoom', function (Zoom) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      Zoom.bind(element);
    }
  };
});