import {loader, autoDetectRenderer, Text} from 'pixi.js';
import {remove as _remove} from 'lodash/array';
import levels from '../data/levels.json';
import Stage from './Stage';
import sound from './Sound';
import levelCreator from '../libs/levelCreator.js';
import utils from '../libs/utils';
import QRCode from 'qrcode';
import {Sprite, TextStyle, Texture} from 'pixi.js/lib/core';

const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;
const BOTTOM_LINK_STYLE = {
  fontFamily: 'Arial',
  fontSize: '15px',
  align: 'left',
  fill: 'white'
};

const MESSAGE_START_STYLE = {
  fontFamily: 'Arial',
  fontSize: '20px',
  align: 'center',
  fill: 'white'
};
const CONTROLLER_ENDPOINT = 'LINK_CONTROLLER';

class Game {
  /**
   * Game Constructor
   * @param opts
   * @param {String} opts.spritesheet The object property to ask PIXI's resource loader for
   * @param  opts.socket The socket object to use for communication
   * @returns {Game}
   */
  constructor(opts) {
    this.spritesheet = opts.spritesheet;
    this.loader = loader;
    this.renderer =  autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: BLUE_SKY_COLOR
    });
    this.levelIndex = 0;
    this.maxScore = 0;
    this.timePaused = 0;
    this.muted = false;
    this.paused = false;
    this.activeSounds = [];
    this.waveEnding = false;
    this.quackingSoundId = null;
    this.levels = levels.normal;
    this.qrSprite = null;
    this.qrCodeMessage = null;
    this.started = false;
    return this;
  }

  get ducksMissed() {
    return this.ducksMissedVal ? this.ducksMissedVal : 0;
  }

  set ducksMissed(val) {
    this.ducksMissedVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'ducksMissed')) {
        this.stage.hud.createTextureBasedCounter('ducksMissed', {
          texture: 'hud/score-live/0.png',
          spritesheet: this.spritesheet,
          location: Stage.missedDuckStatusBoxLocation(),
          rowMax: 20,
          max: 20
        });
      }

      this.stage.hud.ducksMissed = val;
    }
  }

  get ducksShot() {
    return this.ducksShotVal ? this.ducksShotVal : 0;
  }

  set ducksShot(val) {
    this.ducksShotVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'ducksShot')) {
        this.stage.hud.createTextureBasedCounter('ducksShot', {
          texture: 'hud/score-dead/0.png',
          spritesheet: this.spritesheet,
          location: Stage.deadDuckStatusBoxLocation(),
          rowMax:20,
          max: 20
        });
      }

      this.stage.hud.ducksShot = val;
    }
  }
  /**
   * bullets - getter
   * @returns {Number}
   */
  get bullets() {
    return this.bulletVal ? this.bulletVal : 0;
  }

  /**
   * bullets - setter
   * Setter for the bullets property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying bullets, the property and a corresponding texture container
   * will be created in HUD.
   * @param {Number} val Number of bullets
   */
  set bullets(val) {
    this.bulletVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'bullets')) {
        this.stage.hud.createTextureBasedCounter('bullets', {
          texture: 'hud/bullet/0.png',
          spritesheet: this.spritesheet,
          location: Stage.bulletStatusBoxLocation(),
          max: 80,
          rowMax: 20
        });
      }

      this.stage.hud.bullets = val;
    }

  }

  /**
   * score - getter
   * @returns {Number}
   */
  get score() {
    return this.scoreVal ? this.scoreVal : 0;
  }

  /**
   * score - setter
   * Setter for the score property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the score, the property and a corresponding text box
   * will be created in HUD.
   * @param {Number} val Score value to set
   */
  set score(val) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'score')) {
        this.stage.hud.createTextBox('score', {
          style: {
            fontFamily: 'Arial',
            fontSize: '18px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.scoreBoxLocation(),
          anchor: {
            x: 1,
            y: 0
          }
        });
      }

      this.stage.hud.score = val;
    }

  }

  /**
   * wave - get
   * @returns {Number}
   */
  get wave() {
    return this.waveVal ? this.waveVal : 0;
  }

  /**
   * wave - set
   * Setter for the wave property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the wave, the property and a corresponding text box
   * will be created in the HUD.
   * @param {Number} val
   */
  set wave(val) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'waveStatus')) {
        this.stage.hud.createTextBox('waveStatus', {
          style: {
            fontFamily: 'Arial',
            fontSize: '14px',
            align: 'center',
            fill: 'white'
          },
          location: Stage.waveStatusBoxLocation(),
          anchor: {
            x: 1,
            y: 1
          }
        });
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = 'wave ' + val + ' of ' + this.level.waves;
      } else {
        this.stage.hud.waveStatus = '';
      }
    }
  }

  /**
   * gameStatus - get
   * @returns {String}
   */
  get gameStatus() {
    return this.gameStatusVal ? this.gameStatusVal : '';
  }

  /**
   * gameStatus - set
   * @param {String} val
   */
  set gameStatus(val) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud,'gameStatus')) {
        this.stage.hud.createTextBox('gameStatus', {
          style: {
            fontFamily: 'Arial',
            fontSize: '40px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.gameStatusBoxLocation()
        });
      }

      this.stage.hud.gameStatus = val;
    }
  }

  load() {
    this.loader
      .add(this.spritesheet)
      .load(this.onLoad.bind(this));
  }

  onLoad() {
    document.body.appendChild(this.renderer.view);

    this.stage = new Stage({
      spritesheet: this.spritesheet
    });

    if (!this.started) {
      this.renderQRCode();
      this.addScanQrCodeMessage();
    }
    this.scaleToWindow();
    this.addLinkToLevelCreator();
    this.addPauseLink();
    this.addMuteLink();
    this.addFullscreenLink();
    this.bindEvents();
    this.animate();
  }

  addFullscreenLink() {
    this.stage.hud.createTextBox('fullscreenLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.fullscreenLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.fullscreenLink = 'fullscreen (f)';
  }
  addMuteLink() {
    this.stage.hud.createTextBox('muteLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.muteLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.muteLink = 'mute (m)';
  }

  addPauseLink() {
    this.stage.hud.createTextBox('pauseLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.pauseLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.pauseLink = 'pause (p)';
  }


  addLinkToLevelCreator() {
    this.stage.hud.createTextBox('levelCreatorLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.levelCreatorLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.levelCreatorLink = 'level creator (c)';
  }

  moveAim(coordinates) {
    this.stage.aim.move(coordinates.x.toFixed(2), coordinates.y.toFixed(2));
  }

  shoot(coordinates) {
    this.stage.aim.move(coordinates.x, coordinates.y);
    const position = this.stage.aim.getGlobalPosition();
    this.handleClick({
      data: {
        global: position,
      }
    });
  }

  handleStartGame() {
    this.startLevel();
    this.removeQRCode();
    this.removeScanQrCodeMessage();
  }

  bindEvents() {
    window.addEventListener('resize', this.scaleToWindow.bind(this));

    this.stage.mousedown = this.stage.touchstart = this.handleClick.bind(this);
    this.stage.socket.onCoordinates(this.moveAim.bind(this));
    this.stage.socket.onShoot(this.shoot.bind(this));
    this.stage.socket.startGame(this.handleStartGame.bind(this));

    document.addEventListener('keypress', (event) => {
      event.stopImmediatePropagation();

      if (event.key === 'p') {
        this.pause();
      }

      if (event.key === 'm') {
        this.mute();
      }

      if (event.key === 'c') {
        this.openLevelCreator();
      }

      if (event.key === 'f') {
        this.fullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.stage.hud.fullscreenLink = 'unfullscreen (f)';
      } else {
        this.stage.hud.fullscreenLink = 'fullscreen (f)';
      }
    });

    sound.on('play', (soundId) => {
      if (this.activeSounds.indexOf(soundId) === -1) {
        this.activeSounds.push(soundId);
      }
    });
    sound.on('stop', this.removeActiveSound.bind(this));
    sound.on('end', this.removeActiveSound.bind(this));
  }

  fullscreen() {
    this.isFullscreen = !this.isFullscreen;
    utils.toggleFullscreen();
  }

  pause() {
    this.stage.hud.pauseLink = this.paused ? 'pause (p)' : 'unpause (p)';
    // SetTimeout, woof. Thing is here we need to leave enough animation frames for the HUD status to be updated
    // before pausing all rendering, otherwise the text update we need above won't be shown to the user.
    setTimeout(() => {
      this.paused = !this.paused;
      if (this.paused) {
        this.pauseStartTime = Date.now();
        this.stage.pause();
        this.activeSounds.forEach((soundId) => {
          sound.pause(soundId);
        });
      } else {
        this.timePaused += (Date.now() - this.pauseStartTime) / 1000;
        this.stage.resume();
        this.activeSounds.forEach((soundId) => {
          sound.play(soundId);
        });
      }
    }, 40);
  }

  removeActiveSound(soundId) {
    _remove(this.activeSounds, function(item) {
      return item === soundId;
    });
  }

  mute() {
    this.stage.hud.muteLink = this.muted ? 'mute (m)' : 'unmute (m)';
    this.muted = !this.muted;
    sound.mute(this.muted);
  }

  scaleToWindow() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  startLevel() {
    if (levelCreator.urlContainsLevelData()) {
      this.level = levelCreator.parseLevelQueryString();
      this.levelIndex = this.levels.length - 1;
    } else {
      this.level = this.levels[this.levelIndex];
    }

    this.maxScore += this.level.waves * this.level.ducks * this.level.pointsPerDuck;
    this.ducksShot = 0;
    this.ducksMissed = 0;
    this.wave = 0;

    this.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(() => {
      this.gameStatus = '';
      this.startWave();
    });
  }

  startWave() {
    this.quackingSoundId = sound.play('quacking');
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.bullets = this.level.bullets;
    this.ducksShotThisWave = 0;
    this.waveEnding = false;

    this.stage.addDucks(this.level.ducks, this.level.speed);
  }

  endWave() {
    this.waveEnding = true;
    this.bullets = 0;
    sound.stop(this.quackingSoundId);
    if (this.stage.ducksAlive()) {
      this.ducksMissed += this.level.ducks - this.ducksShotThisWave;
      this.renderer.backgroundColor = PINK_SKY_COLOR;
      this.stage.flyAway().then(this.goToNextWave.bind(this));
    } else {
      this.stage.cleanUpDucks();
      this.goToNextWave();
    }
  }

  goToNextWave() {
    this.renderer.backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd() {
    // evaluate pre-requisites for a wave to end
    if (this.wave === 0 || this.waveEnding || this.stage.dogActive()) {
      return false;
    }

    return this.isWaveTimeUp() || (this.outOfAmmo() && this.stage.ducksAlive()) || !this.stage.ducksActive();
  }

  isWaveTimeUp() {
    return this.level ? this.waveElapsedTime() >= this.level.time : false;
  }

  waveElapsedTime() {
    return ((Date.now() - this.waveStartTime) / 1000) - this.timePaused;
  }

  outOfAmmo() {
    return this.level && this.bullets === 0;
  }

  endLevel() {
    this.wave = 0;
    this.goToNextLevel();
  }

  goToNextLevel() {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon() {
    return this.ducksShot > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  win() {
    sound.play('champ');
    this.gameStatus = 'You Win!';
    this.showReplay(this.getScoreMessage());
  }

  loss() {
    sound.play('loserSound');
    this.gameStatus = 'You Lose!';
    this.showReplay(this.getScoreMessage());
  }

  getScoreMessage() {
    let scoreMessage;

    const percentage = (this.score / this.maxScore) * 100;

    if (percentage === 100) {
      scoreMessage = 'Flawless victory.';
    }

    if (percentage < 100) {
      scoreMessage = 'Close to perfection.';
    }

    if (percentage <= 95) {
      scoreMessage = 'Truly impressive score.';
    }

    if (percentage <= 85) {
      scoreMessage = 'Solid score.';
    }

    if (percentage <= 75) {
      scoreMessage = 'Participation award.';
    }

    if (percentage <= 63) {
      scoreMessage = 'Yikes.';
    }

    return scoreMessage;
  }

  showReplay(replayText) {
    this.stage.hud.createTextBox('replayButton', {
      location: Stage.replayButtonLocation()
    });
    this.stage.hud.replayButton = replayText + ' Play Again?';
  }

  openLevelCreator() {
    // If they didn't pause the game, pause it for them
    if (!this.paused) {
      this.pause();
    }
    window.open('/creator.html', '_blank');
  }

  handleClick(event) {
    const clickPoint = {
      x: event.data.global.x,
      y: event.data.global.y
    };

    if (this.stage.clickedPauseLink(clickPoint)) {
      this.pause();
      return;
    }

    if (this.stage.clickedMuteLink(clickPoint)) {
      this.mute();
      return;
    }

    if (this.stage.clickedFullscreenLink(clickPoint)) {
      this.fullscreen();
      return;
    }

    if (this.stage.clickedLevelCreatorLink(clickPoint)) {
      this.openLevelCreator();
      return;
    }

    if (!this.stage.hud.replayButton && !this.outOfAmmo() && !this.shouldWaveEnd() && !this.paused) {
      sound.play('gunSound');
      this.bullets -= 1;
      this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
      return;
    }

    if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
      window.location = window.location.pathname;
    }
  }

  updateScore(ducksShot) {
    this.ducksShot += ducksShot;
    this.ducksShotThisWave += ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
  }

  animate() {
    if (!this.paused) {
      this.renderer.render(this.stage);

      if (this.shouldWaveEnd()) {
        this.endWave();
      }
    }

    requestAnimationFrame(this.animate.bind(this));
  }

  addScanQrCodeMessage() {
    const message = new Text('Scan QR para acessar o controle', new TextStyle(MESSAGE_START_STYLE));

    message.anchor.set(0.5, 8);
    message.position.set(Stage.scanQrCodeMessageLocation().x, Stage.scanQrCodeMessageLocation().y);

    this.stage.addChild(message);

    this.qrCodeMessage = message;

  }

  removeScanQrCodeMessage() {
    if (this.qrCodeMessage) {
      this.stage.removeChild(this.qrCodeMessage);
      this.qrCodeMessage.destroy();
      this.qrCodeMessage = null;
    }
  }

  generateQRCode(data) {
    const canvas = document.createElement('canvas');
    return QRCode.toCanvas(canvas, data, { width: 200, margin: 1 })
      .then(() => Texture.from(canvas))
      .catch((err) => {
        console.error('Erro ao gerar QR Code:', err);
      });
  }

  renderQRCode() {
    const qrData = `${CONTROLLER_ENDPOINT}?party=${this.stage.partyId}`;
    this.generateQRCode(qrData).then((qrTexture) => {
      if (!qrTexture) return;

      if (this.qrSprite) {
        this.removeQRCode();
      }

      this.qrSprite = new Sprite(qrTexture);
      this.qrSprite.anchor.set(0.5);
      this.qrSprite.position.set(Stage.qrCodeLocation().x, Stage.qrCodeLocation().y);

      this.stage.addChild(this.qrSprite);

    });
  }

  removeQRCode() {
    if (this.qrSprite) {
      this.stage.removeChild(this.qrSprite);
      this.qrSprite.destroy();
      this.qrSprite = null;
    }
  }

}

export default Game;
