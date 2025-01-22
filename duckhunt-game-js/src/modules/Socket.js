class Socket {
  constructor() {
    this.ws = null;
    this.onCoordinatesReceived = null;
    this.onShootReceived = null;
    this.startGameCallback = null;
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8080/ws?id=1');

    this.ws.onopen = () => {
      console.log('Conectado ao servidor');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (this.onCoordinatesReceived) {
          switch (data.to) {
            case 'location':
              this.onCoordinatesReceived(data.coordinates);
              break;
            case 'shoot':
              this.onShootReceived(data.coordinates);
              break;
            case 'start':
              this.startGameCallback();
              break;
            default:
              break;
          }

        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Desconectado do servidor');
    };

    this.ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
  }

  onCoordinates(callback) {
    this.onCoordinatesReceived = callback;
  }

  onShoot(callback) {
    this.onShootReceived = callback;
  }

  startGame(callback) {
    this.startGameCallback = callback;
  }
}

export default Socket;
