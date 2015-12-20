'use strict';

angular.module('modifiedNouns', [
  'modifiedNouns.fullscreen',
  'modifiedNouns.loader'
])

.directive('loadProgress', function (Loader) {
  return {
    restrict: 'A',
    scope: true,
    link: function (scope, element) {
      scope.progressData = Loader.progressData.total;
      
      var scaledPercent;
      
      scope.$watch('progressData.percent', function (percent) {
        scaledPercent = percent + (percent * .1);
        element.css('width', scaledPercent + '%');
      });
    }
  };
})

.directive('modifiedNouns', function ($window, ASSET_DATA, Loader) {
  return {
    restrict: 'A',
    scope: true,
    link: function (scope, element) {
      scope.images = Loader.images;
      scope.levels = {};
      
      var hasTopLevel = function (images) {
        for (var i = 0; i < ASSET_DATA.img.tiles; i++) {
          var key = Loader.getImageKey([1, i]);
          
          if(!images.hasOwnProperty(key)) {
            return false;
          }
        }
        
        return true;
      };
      
      var appendTiles = function (image, key) {
        if(key !== 'length') {
          var imgData = key.match(/\d+/g);
          
          if(!scope.levels.hasOwnProperty(imgData[0])) {
            scope.levels[ imgData[0] ] = {};
          }
          
          var level = scope.levels[ imgData[0] ];
          
          if(!level.hasOwnProperty(imgData[1])) {
            level[ imgData[1] ] = image.src;
          }
        }
      };
      
      scope.getStyles = function (number, src) {
        number = $window.parseInt(number, 10);
        
        var styles = {
          'background-image': 'url(' + src + ')'
        };
        
        var xAnchor = number % 2 === 0 ? 'left' : 'right';
        var yAnchor = number < 2 ? 'top' : 'bottom';
        
        styles[xAnchor] = styles[yAnchor] = 0;
        
        return styles;
      };
      
      scope.$watchCollection('images', function (images) {
        // Add tiles to DOM as they come in
        angular.forEach(images, appendTiles);
        
        if(hasTopLevel(images)) {
          // Wait until the next execution context
          scope.$applyAsync(function () {
            scope.hasTopLevel = true;
          });
        }
      });
    }
  };
})

.run(function (Loader) {
  Loader.getModifiedNouns();
  Loader.getImages();
});