'use strict';

angular.module('modifiedNouns.zoom', [])

.directive('zoom', function () {

  return {
    restrict: 'A',
    link: function (scope, element) {

      element.on('wheel', function (e) {
        console.log(e);
      });

    }
  };

});