'use strict';

angular.module('modifiedNouns', [
  'modifiedNouns.input',
  'modifiedNouns.geometry',
  'modifiedNouns.limit',
  'modifiedNouns.drag',
  'modifiedNouns.fling',
  'modifiedNouns.zoom',
  'modifiedNouns.fullscreen',
  'modifiedNouns.loader',
  'modifiedNouns.search'
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

.factory('ModifiedNouns', function ($window, ASSET_DATA, Loader) {

  var FULL_SIZE = {
    width: 4500,
    height: 6000
  };

  var levels = new $window.Array(ASSET_DATA.img.levels);

  var level, curLevel, levelData, centerX, centerY;

  var positionLevels = function (centerX, centerY) {
    for (var i = 0; i < levels.length; i++) {
      level = levels[i];

      level.position.left = centerX - level.size.width / 2;
      level.position.top = centerY - level.size.height / 2;

      level.element.css({
        left: level.position.left + 'px',
        top:  level.position.top + 'px'
      });
    }
  };

  return {
    FULL_SIZE: FULL_SIZE,
    levels: levels,
    data: null,

    load: function () {
      var modifiedNouns = this;

      Loader.getImages();

      Loader.getModifiedNouns().then(function (data) {
        modifiedNouns.data = data;
      });
    },

    init: function () {
      this.positionLevel(curLevel = levels[0], 0, 0);
    },

    getCurLevel: function () {
      return curLevel;
    },

    hideLevel: function (level) {
      level.element.css('display', 'none');
    },

    positionLevel: function (level, left, top) {
      curLevel = level; // Positioning the level makes it current

      centerX = left + level.size.width / 2;
      centerY = top + level.size.height / 2;

      positionLevels(centerX, centerY);

      return levelData;
    },

    scaleLevel: function (level, size, position) {
      level.size.width = size.width;
      level.size.height = size.height;

      this.positionLevel(level, position.x, position.y);

      level.element.css({
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
    link: function (scope, element, attrs) {
      var scaleFactor = $window.parseInt(attrs.level);
      var order = $window.Math.log(scaleFactor) / $window.Math.LN2;

      var size = {
        width: ModifiedNouns.FULL_SIZE.width / scaleFactor,
        height: ModifiedNouns.FULL_SIZE.height / scaleFactor
      };

      var position = {
        left: (ModifiedNouns.FULL_SIZE.width - size.width) / 2,
        top: (ModifiedNouns.FULL_SIZE.height - size.height) / 2
      };

      var range = {
        max: 1 / scaleFactor,
        min: 1 / (scaleFactor * 2)
      };

      var data = {
        scaleFactor: scaleFactor,
        order: order,
        size: size,
        position: position,
        range: range
      };

      ModifiedNouns.levels[order] = data;
      ModifiedNouns.levels[order].element = element;

      element.data('level.order', order);
    }
  };
})

.directive('modifiedNouns', function ($window, Loader, ModifiedNouns) {
  return {
    restrict: 'A',
    scope: true,
    link: function (scope) {
      scope.total = Loader.progressData.total;
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
          scope.$applyAsync(function () {
            scope.hasTopLevel = true;
          });
        }
      });

      scope.$watch('total.complete', function (complete) {
        if(complete) {
          scope.$applyAsync(ModifiedNouns.init.bind(ModifiedNouns));
        }
      });

    }
  };
})

.run(function ($window, ModifiedNouns) {
  angular.element($window).on('touchmove', function (e) {
    e.preventDefault(); // Prevent window scrolling / bouncing
  });

  ModifiedNouns.load();
});