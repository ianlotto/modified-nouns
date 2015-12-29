'use strict';

angular.module('modifiedNouns.zoom', [])

.directive('zoom', function (Input) {

  return {
    restrict: 'A',
    link: function (scope, element) {

      var delta;

      element.on('wheel', function (e) {
        e.preventDefault();

        var delta = Input.normalizeWheelDelta(e);
      });

    }
  };

});