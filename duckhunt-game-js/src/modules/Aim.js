import Character from './Character';
import { Point } from 'pixi.js';

class Aim extends Character{
  /**
   * Aim constructor
   * @param {Object} options
   * @param {String} options.spritesheet The object property to ask PIXI's resource loader for
   */
  constructor(options) {
    super('aim', options.spritesheet, [
      {
        name: 'aim',
        animationSpeed: 0.1
      }
    ]);
    this.width = 40;
    this.height = 40;
    this.visible = true;
    this.position.set(400, 300);
  }

  move(x, y) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;
    const amplitude = 2000;

    const alphaRad = x  * Math.PI / 180;
    const betaRad = y  * Math.PI / 90;

    const normalized_x = (centerX - amplitude * Math.sin(alphaRad));
    const normalized_y = (centerY - amplitude * Math.sin(betaRad));

    const coord = new Point(normalized_x, normalized_y);

    const localPosition = this.parent.toLocal({x: coord.x, y: coord.y});

    this.position.set(localPosition.x, localPosition.y);
  }

}

export default Aim;