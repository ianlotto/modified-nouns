'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom', function ($window, ASSET_DATA, Input) {

  var ZOOM_DAMPER = 2000;

  var targets = [];
  var size = {};

  var scale = {
    current: 1,
    max: 1,
    min: $window.Math.pow(2, -ASSET_DATA.img.levels)
  };

  // TODO: better way to set this?
  var fullDims = { height: 6000, width: 4500 };

  var prevTarget, target;

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

  return {
    scale: scale,
    registerTarget: registerTarget,

    bind: function (element) {
      var targetEl, delta, dir;

      element.on('wheel', function (e) {
        e.preventDefault();

        if(element[0] === e.target) { return; }

        delta = Input.normalizeWheelDelta(e, element);

        scale.current += delta / ZOOM_DAMPER;

        // Global constraints
        // TODO: think about incorporating with Limit
        if(scale.current > scale.max) {
          scale.current = scale.max;
        } else if(scale.current < scale.min) {
          scale.current = scale.min;
        }

        size.width = fullDims.width * scale.current;
        size.height = fullDims.height * scale.current;

        prevTarget = target;
        target = findTarget(scale.current, targets);

        // TODO: position around zoom point as well
        // TODO: try opacity change when zooming... needs some kind of effect

        sizeElement(target.element, size.width, size.height);

        if(!!prevTarget && prevTarget.element !== target.element) {
          hideElement(prevTarget.element);
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