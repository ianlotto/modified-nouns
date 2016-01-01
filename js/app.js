'use strict';

angular.module('modifiedNouns', [
  'modifiedNouns.input',
  'modifiedNouns.geometry',
  'modifiedNouns.limit',
  'modifiedNouns.drag',
  'modifiedNouns.fling',
  'modifiedNouns.zoom',
  'modifiedNouns.fullscreen',
  'modifiedNouns.loader'
])

.constant('ASSET_DATA', {
  mnSrc: 'data/modified_nouns.json',
  img: {
    template: 'data/{0}/{1}.jpg',
    regExp: /\{(\d)\}/g,
    levels: 5,
    tiles: 4
  }
})

.factory('ModifiedNouns', function ($window, ASSET_DATA) {
  var levels = new $window.Array(ASSET_DATA.img.levels);

  return {

    FULL_SIZE: {
      width: 4500,
      height: 6000
    },

    levels: levels,

    positionLevel: function (level, left, top) {
      level.css({
        left: left + 'px',
        top: top + 'px'
      });
    },

    scaleLevel: function (level, size, position) {
      this.positionLevel(level, position.x, position.y);

      level.css({
        display: 'block',
        width:  size.width + 'px',
        height: size.height + 'px'
      });
    }

  };
})

.directive('level', function ($window, ModifiedNouns) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      var key = $window.parseInt(scope.key);

      var data = {
        order: $window.Math.log(key) / $window.Math.LN2,
        range: { max: 1 / key, min: 1 / (key * 2) }
      };

      ModifiedNouns.levels[data.order] = data;
      ModifiedNouns.levels[data.order].element = element;
    }
  };
})

.directive('modifiedNouns', function ($window, Loader) {
  return {
    restrict: 'A',
    scope: true,
    link: function (scope) {
      scope.images = Loader.images;
      scope.levels = {};

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

        if(Loader.hasLevel(1)) {
          // Wait until the next execution context
          scope.$applyAsync(function () {
            scope.hasTopLevel = true;
          });
        }
      });
    }
  };
})

.run(function ($window, Loader) {
  angular.element($window).on('touchmove', function (e) {
    e.preventDefault(); // Prevent window scrolling / bouncing
  });

  Loader.getModifiedNouns();
  Loader.getImages();
});