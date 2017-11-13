(function() {

  'use strict';

  function RatingStarsDirective() {

    function link(scope, element, attrs, ctrl) {
      if (!attrs.maxRating || (parseInt(attrs.maxRating) <= 0)) {
        attrs.maxRating = '5';
      }
      scope.$watch('ctrl.maxRating', function(oldVal, newVal) {
        ctrl.initStarsArray();
      });
      scope.$watch('ctrl.rating', function(oldVal, newVal) {
        ctrl.validateStars(ctrl.rating);
      });
    }

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'rating-stars-directive.html',
      scope: {},
      controller: 'RatingStarsController',
      controllerAs: 'ctrl',
      bindToController: {
        maxRating: '@?',
        rating: '=?',
        readOnly: '=?',
        onRating: '&'
      },
      link: link
    };
  }

  angular
    .module('jkAngularRatingStars')
    .directive('jkRatingStars', [
    RatingStarsDirective
  ]);

}());
