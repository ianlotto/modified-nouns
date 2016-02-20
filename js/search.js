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

.directive('search', function (ModifiedNouns, FlingAnimation, Search) {
  return {
    restrict: 'A',
    link: function (scope) {
      var curLevel;

      scope.modifiedNouns = ModifiedNouns;
      scope.input = null;

      scope.search = function () {
        scope.matches = !!scope.input ? Search.search(scope.input) : [];
      };

      scope.goTo = function (match) {
        console.log(match);
        curLevel = ModifiedNouns.getCurLevel();

        FlingAnimation.start({
          startX: curLevel.position.left,
          finishX: match.column * -200,
          startY: curLevel.position.top,
          finishY: match.row * -200
        }, curLevel);
      };

      scope.$watch('modifiedNouns.data', function (data) {
      });
    }
  };
});