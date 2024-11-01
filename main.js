import Game from './src/modules/Game';

document.addEventListener('DOMContentLoaded', function() {

  new Game({
    spritesheet: 'sprites.json'
  }).load();

}, false);
