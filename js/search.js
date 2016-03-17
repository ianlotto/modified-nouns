'use strict';

angular.module('modifiedNouns.search', [])

.factory('Search', function ($window, ModifiedNouns) {
  var searchExp, modifiedNoun, matches;

  return {
    search: function (input) {
      searchExp = new $window.RegExp('^' + input.toLowerCase());

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

// TODO: style search

// RELEASE

// TODO: keyboard interface for search
// TODO: zoom in full size on search as well

.directive('search', function ($window, $timeout, Input, Animation, Search) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope) {
        var $$window = angular.element($window);

        var hideMatches = function () {
          $$window.off(Input.EVENTS.start, hideMatches);

          $timeout(function () {
            scope.setMatchesDisplay(false);
          });
        };

        scope.input = null;

        scope.setMatchesDisplay = function (show) {
          scope.showMatches = angular.isDefined(show) ?
            !!show : !scope.showMatches;
        };

        scope.search = function () {
          scope.matches = !!scope.input ? Search.search(scope.input) : [];

          scope.setMatchesDisplay(scope.matches.length > 0);
        };

        scope.flyTo = function (match) {
          Animation.stop();
          Animation.flyToTile([match.column, match.row]);

          scope.setMatchesDisplay(false);
        };

        scope.$watch('showMatches', function (n) {
          if(!!n) {
            $$window.on(Input.EVENTS.start, hideMatches);
          }
        });

      }
    };
  }
);