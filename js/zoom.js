'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom', function ($window, ASSET_DATA, Input) {

  var ZOOM_DAMPER = 10000;

  var levels = [];
  var size = {};

  var scale = {
    current: 1,
    max: 1,
    min: $window.Math.pow(2, -ASSET_DATA.img.levels)
  };

  var fullDims;

  var registerLevel = function (element, data) {
    levels[ data.order ] = angular.copy(data);
    levels[ data.order ].element = element;
  };

  var sizeElement = function (element, width, height) {
    element.css({
      display: 'block',
      width:  width + 'px',
      height: height + 'px'
    });
  };

  var inRange = function (current, range) {
    return !!(current <= range.max && current >= range.min);
  };

  return {
    scale: scale,

    bind: function (element, data) {
      var targetEl, delta, dir;

      registerLevel(element, data);

      element.on('wheel', function (e) {
        e.preventDefault();

        // TODO: better way to get this
        if(!fullDims) {
          fullDims = element[0].getBoundingClientRect();
          fullDims = { height: fullDims.height, width: fullDims.width };
        }

        delta = Input.normalizeWheelDelta(e);

        scale.current += (delta / ZOOM_DAMPER);

        // Global constraints
        // TODO: think about incorporating with Limit
        if(scale.current > scale.max) {
          scale.current = scale.max;
        } else if(scale.current < scale.min) {
          scale.current = scale.min;
        }

        size.width = fullDims.width * scale.current;
        size.height = fullDims.height * scale.current;

        if(inRange(scale.current, data.range)) {
          targetEl = element;
        } else {
          dir = scale.current >= data.range.max ? -1 : 1;
          // Swap out current level and start targeting the next
          targetEl = levels[ data.order + dir ].element;
          element.css('display', 'none');
        }

        // TODO: position around zoom point as well
        // TODO: try opacity change when zooming... needs some kind of effect
        sizeElement(targetEl, size.width, size.height);
      });

    }
  };

})

.directive('zoom', function ($window, Zoom) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      var key = $window.parseInt(scope.key);
      var scale = Zoom.scale;

      var data = {
        order: $window.Math.log(key) / $window.Math.LN2,
        range: { max: 1 / key, min: 1 / (key * 2) }
      };

      Zoom.bind(element, data);
    }
  };
});