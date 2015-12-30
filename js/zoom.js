'use strict';

angular.module('modifiedNouns.zoom', [])

.factory('Zoom', function ($window, Input) {

  return {
    bind: function (element) {
      var scale = 1;

      var delta, scale, fullDims;

      element.on('wheel', function (e) {
        e.preventDefault();

        if(!fullDims) {
          fullDims = element[0].getBoundingClientRect();
          fullDims = { height: fullDims.height, width: fullDims.width };
        }

        delta = Input.normalizeWheelDelta(e);

        scale += (delta / 2000);

        // TODO: swap out to new level
        if(scale > 1) {
          scale = 1;
        } else if(scale < 0.5) {
          scale = 0.5
        }

        element.css({
          height: (fullDims.height * scale) + 'px',
          width:  (fullDims.width * scale) + 'px'
        });

        // TODO: position around zoom point as well

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