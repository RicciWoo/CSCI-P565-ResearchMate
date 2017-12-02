(function() {
  'use strict';

  function RatingStarsController($attrs, $timeout) {

    var that = this;

    if (that.readOnly === undefined) {
      that.readOnly = false;
    }

    that.initStarsArray = function() {
      that.starsArray = that.getStarsArray();
      that.validateStars(that.rating);
    };

    that.getStarsArray = function() {
      var starsArray = [];
      for (var index = 0; index < that.maxRating; index++) {
        var starItem = {
          index: index,
          class: 'star-off'
        };
        starsArray.push(starItem);
      }
      return starsArray;
    };

    that.setRating = function(rating) {
      if (that.readOnly) {
        return;
      }
      that.rating = rating;
      that.validateStars(that.rating);
      $timeout(function() {
        that.onRating({
          rating: that.rating
        });
      });
    };

    that.setMouseOverRating = function(rating) {
      if (that.readOnly) {
        return;
      }
      that.validateStars(rating);
    };

    that.validateStars = function(rating) {
      if (!that.starsArray || that.starsArray.length === 0) {
        return;
      }
      for (var index = 0; index < that.starsArray.length; index++) {
        var starItem = that.starsArray[index];
        if (index <= (rating - 1)) {
          starItem.class = 'star-on';
        } else {
          starItem.class = 'star-off';
        }
      }
    };

  }

  angular
    .module('jkAngularRatingStars')
    .controller('RatingStarsController', [
      '$attrs', '$timeout',
      RatingStarsController
    ]);

}());
