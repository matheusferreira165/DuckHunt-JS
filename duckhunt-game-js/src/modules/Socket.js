class Socket {
  constructor() {
    this.ws = null;
    this.onCoordinatesReceived = null;
    this.onShootReceived = null;
    this.startGameCallback = null;
  }

  connect(partyId) {
    this.ws = new WebSocket(`ws://localhost:8080/ws?id=${partyId}`);

    this.ws.onopen = () => {
      console.log('Conectado ao servidor');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data) {
          switch (data.to) {
            case 'start':
              this.startGameCallback();
              break;
            case 'location':
              this.onCoordinatesReceived(data.coordinates);
              break;
            case 'shoot':
              this.onShootReceived(data.coordinates);
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
