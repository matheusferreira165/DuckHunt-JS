import Character from './Character';

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
    this.position.set(300, 350);
  }

  move(x, y) {
    const localPosition = this.parent.toLocal({ x, y });
    this.position.set(localPosition.x, localPosition.y);

  }
}

export default Aim;