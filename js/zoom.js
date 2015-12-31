'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom',
  function ($window, $timeout, ASSET_DATA, Limit, Input, positionEl) {

    var ZOOM_FACTOR = 200;
    var zooming = false;

    var pos = { z: 1 };
    var size = {};
    var offset = {};
    var targets = [];

    var wheelTouch, prevTarget, target, position, elRect, cancel;

    var scaleElement = function (element, size, position) {
      element.css({
        display: 'block',
        width:  size.width + 'px',
        height: size.height + 'px'
      });

      positionEl(element, position.x, position.y);
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

    var registerTarget = function (element, data) {
      targets[ data.order ] = angular.copy(data);
      targets[ data.order ].element = element;
    };

    var findTarget = function (z, targets) {
      for (var i = 0; i < targets.length; i++) {
        target = targets[i];

        if(inRange(z, target.range)) {
          break;
        }
      }

      return target;
    };

    var inRange = function (z, range) {
      return !!(z <= range.max && z >= range.min);
    };

    var zoom = function (wheelTouch) {
      pos.z += wheelTouch.dir / ZOOM_FACTOR;
      pos = constrainScale(pos, Limit.check(pos));

      prevTarget = target;
      target = findTarget(pos.z, targets);

      size = getScaledSize(size, pos.z);
      position = getScaledPosition(target.element, size, wheelTouch);

      scaleElement(target.element, size, position);

      if(!!prevTarget && prevTarget.element !== target.element) {
        hideElement(prevTarget.element);
      }
    };

    Limit.setZ(1, $window.Math.pow(2, -ASSET_DATA.img.levels));

    return {
      registerTarget: registerTarget,

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

.directive('zoom', function ($window, Zoom) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var action = attrs.zoom;

      if(action === 'bind') {
        Zoom.bind(element);
      } else if(action === 'target') {
        var key = $window.parseInt(scope.key);

        var data = {
          order: $window.Math.log(key) / $window.Math.LN2,
          range: { max: 1 / key, min: 1 / (key * 2) }
        };

        Zoom.registerTarget(element, data);
      }
    }
  };
});