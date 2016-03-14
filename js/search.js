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

// RELEASE

// TODO: zoom in full size on search as well

.directive('search',
  function ($window, $timeout, ModifiedNouns, Animation, Search) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope) {
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
          Animation.stop();
          Animation.flyToTile([match.column, match.row]);

          scope.setMatchesDisplay(false);
        };

      }
    };
  }
);