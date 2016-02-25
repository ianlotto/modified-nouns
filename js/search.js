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
          searchExp.test(modifiedNoun.modifier)
        ) {

          matches.push(ModifiedNouns.data[i]);
        }
      }

      return matches;
    }
  };
})

// TODO: cleanup goTo method

.directive('search', function (ASSET_DATA, ModifiedNouns, FlingAnimation, Search) {
  return {
    restrict: 'A',
    link: function (scope) {
      var curLevel, curScale, $parent, parentData;

      var dimensions = ASSET_DATA.dimensions;

      scope.modifiedNouns = ModifiedNouns;
      scope.input = null;

      scope.search = function () {
        scope.matches = !!scope.input ? Search.search(scope.input) : [];
      };

      scope.goTo = function (match) {
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
      };

    }
  };
});