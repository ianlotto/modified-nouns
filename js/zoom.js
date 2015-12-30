'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom', function ($window, $timeout, ASSET_DATA, Input) {

  var ZOOM_DAMPER = 2000;
  var zooming = false;

  var targets = [];
  var size = {};

  var scale = {
    current: 1,
    max: 1,
    min: $window.Math.pow(2, -ASSET_DATA.img.levels)
  };

  // TODO: better way to set this?
  var fullDims = { height: 6000, width: 4500 };

  var delta, prevTarget, target, cancel;

  var sizeElement = function (element, width, height) {
    element.css({
      display: 'block',
      width:  width + 'px',
      height: height + 'px'
    });
  };

  var hideElement = function (element) {
    element.css('display', 'none');
  };

  var setZoomState = function (element, state) {
    element[state ? 'addClass' : 'removeClass']('zooming');
    zooming = state;
  };

  var constrainScale = function (scale) {
    // TODO: think about incorporating with Limit
    if(scale.current > scale.max) {
      scale.current = scale.max;
    } else if(scale.current < scale.min) {
      scale.current = scale.min;
    }

    return scale;
  };

  var registerTarget = function (element, data) {
    targets[ data.order ] = angular.copy(data);
    targets[ data.order ].element = element;
  };

  var findTarget = function (current, targets) {
    for (var i = 0; i < targets.length; i++) {
      target = targets[i];

      if(inRange(current, target.range)) {
        break;
      }
    }

    return target;
  };

  var inRange = function (current, range) {
    return !!(current <= range.max && current >= range.min);
  };

  var zoom = function (delta) {
    scale.current += delta / ZOOM_DAMPER;
    scale = constrainScale(scale);

    size.width = fullDims.width * scale.current;
    size.height = fullDims.height * scale.current;

    prevTarget = target;
    target = findTarget(scale.current, targets);

    // TODO: position around zoom point as well
    sizeElement(target.element, size.width, size.height);

    if(!!prevTarget && prevTarget.element !== target.element) {
      hideElement(prevTarget.element);
    }
  };

  return {
    scale: scale,
    registerTarget: registerTarget,

    bind: function (element) {
      element.on('wheel', function (e) {
        e.preventDefault();

        if(element[0] !== e.target) {

          if(!zooming) {
            setZoomState(element, true);
          }

          if(!!cancel) {
            $timeout.cancel(cancel);
          }

          cancel = $timeout(setZoomState, 200, false, element, false);

          zoom(Input.normalizeWheelDelta(e, element));
        }
      });
    }
  };

})

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