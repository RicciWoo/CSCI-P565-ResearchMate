# AngularJS Rating Stars

Amazing AngularJS 1 Rating Stars directive that works with Angular Material.

Demo : https://embed.plnkr.co/q7pgHz/

## Install :

### npm
`npm install angular-jk-rating-stars`

### bower
`bower install angular-jk-rating-stars`

## Usage :

 - Add `jk-rating-stars.js` to your index file:
```html
<script src="angular.js"></script>
<script src="jk-rating-stars.js"></script>
```

 - Add `jk-rating-stars.css` to your index file:
```html
<link href="jk-rating-stars.css" rel="stylesheet" type="text/css" />
```
 - Add the google material icons
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

 - Add a dependency to the `jkAngularRatingStars` module in your application.
```js
angular.module('MyApp', ['jkAngularRatingStars']);
```

 - Add a `jk-rating-stars` tag to your html, set the amount of stars and bind a variable that will holds the selected value. If the maxRating variable is not set, we use the default of 5.
```html
<jk-rating-stars max-rating="8" rating="ctrl.rating" read-only="ctrl.readOnly" on-rating="ctrl.onRating(rating)" >
</jk-rating-stars>
```

## TODO :

## License
This module is released under the permissive [MIT license](http://revolunet.mit-license.org). Contributions or suggestions are always welcome :D
