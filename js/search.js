'use strict';

angular.module('modifiedNouns.search', [])

.factory('Search', function ($window, ModifiedNouns) {
  var searchExp, modifiedNoun, matches;

  return {
    search: function (input) {
      searchExp = new $window.RegExp('^' + input);

      matches = [];

      for (var i = 0; i < ModifiedNouns.data.length; i++) {
        modifiedNoun = ModifiedNouns.data[i];

        if(
          searchExp.test(modifiedNoun.noun) ||
          searchExp.test(modifiedNoun.modifier) ||
          searchExp.test([modifiedNoun.modifier, modifiedNoun.noun].join(' '))
        ) {

          matches.push(ModifiedNouns.data[i]);
        }
      }

      return matches;
    }
  };
})

// TODO: constrain MN initially
// TODO: style search
// TODO: cleanup directive

.directive('search',
  function (
    $window, $timeout,
    ASSET_DATA, ModifiedNouns, FlingAnimation, Search
  ) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element) {
        var dimensions = ASSET_DATA.dimensions;
        var matchesEl = $window.document.getElementById('matches');

        var $$window = angular.element($window);

        var curLevel, curScale, $parent, parentData;

        var hideMatches = function (e) {
          if(e.target !== matchesEl) {
            $$window.off('click', hideMatches);

            scope.setMatchesDisplay(false);
          }
        };

        scope.modifiedNouns = ModifiedNouns;
        scope.input = null;

        scope.setMatchesDisplay = function (show) {
          scope.showMatches = angular.isDefined(show) ?
            !!show : !scope.showMatches;
        };

        scope.$watch('showMatches', function (n) {
          if(!!n) {
            $$window.on('mousedown', hideMatches);
          }
        });

        scope.search = function () {
          scope.matches = !!scope.input ? Search.search(scope.input) : [];
          scope.setMatchesDisplay(scope.matches.length > 0);
        };

        scope.goTo = function (match) {
          FlingAnimation.stop();

          curLevel = ModifiedNouns.getCurLevel();
          curScale = curLevel.size.width / ModifiedNouns.FULL_SIZE.width;

          $parent = curLevel.element.parent();

          parentData = $parent[0].getBoundingClientRect();

          var unitWidth = dimensions.tileWidth + dimensions.paddingWidth;
          var centerX = parentData.width / 2 - (dimensions.tileWidth * curScale / 2);

          var posX = match.column * unitWidth + dimensions.marginLeft;

          posX *= -curScale;
          posX += centerX;

          var unitHeight = dimensions.tileHeight + dimensions.paddingHeight;
          var centerY = parentData.height / 2 - (dimensions.tileHeight * curScale / 2);

          var posY = match.row * unitHeight + dimensions.marginTop;

          posY *= -curScale;
          posY += centerY;

          FlingAnimation.start({
            startX: curLevel.position.left,
            finishX: posX,
            startY: curLevel.position.top,
            finishY: posY
          }, curLevel, 'constrain');

          scope.setMatchesDisplay(false);
        };

      }
    };
  }
);