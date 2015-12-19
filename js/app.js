'use strict';

angular.module('modifiedNouns', [])

.constant('MODIFIED_NOUNS', 'data/modified_nouns.json')

.factory('Loader', function ($window, $timeout, $http, MODIFIED_NOUNS) {
  
  var hasLocalStorage = (function () {
    try {
      var test = '__test__';
      
  		$window.localStorage.setItem(test, '');
  		$window.localStorage.removeItem(test);
      
  		return true;
  	}
  	catch(e) {
  		return false;
  	}
  })();
  
  return {
    getModifiedNouns: function () {
      var key = 'modifiedNouns';
      
      var modifiedNouns, promise;
      
      var _http = function () {
        return $http.get(MODIFIED_NOUNS).then(function (response) {
          modifiedNouns = response.data;
          
          $window.localStorage.setItem(key, angular.toJson(modifiedNouns));
          return modifiedNouns;
        });
      };
      
      if(hasLocalStorage) {
        modifiedNouns = angular.fromJson($window.localStorage.getItem(key));
      }
      
      promise = (!modifiedNouns || !hasLocalStorage) ?
        _http() :
        $timeout(function () { return modifiedNouns; });
      
      return promise;
    }
  };
  
})

.run(function (Loader) {
  Loader.getModifiedNouns().then(function (data) {
    
  });
});