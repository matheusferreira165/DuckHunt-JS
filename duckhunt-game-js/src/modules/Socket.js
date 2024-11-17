class Socket {
  constructor() {
    this.ws = null;
    this.onCoordinatesReceived = null; // Callback para processar as coordenadas
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8080/ws?id=1');
    console.log('Conectando ao servidor');
    this.ws.onopen = () => {
      console.log('Conectado ao servidor');
    };

    this.ws.onmessage = (event) => {
      console.log('Mensagem recebida:', event.data);
      try {
        const data = JSON.parse(event.data);

        if (this.onCoordinatesReceived) {
          this.onCoordinatesReceived(data.coordinates); // Envia as coordenadas para o callback
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
}

export default Socket;
