package main

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"sync"
)

type webSocketHandler struct {
	upgrader websocket.Upgrader
	users    map[string]map[*websocket.Conn]bool
	mu       sync.Mutex
}

type Coordinates struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Message struct {
	Coordinates Coordinates `json:"coordinates"`
}

func newWebSocketHandler() *webSocketHandler {
	return &webSocketHandler{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		users: make(map[string]map[*websocket.Conn]bool),
	}
}

func (wsh *webSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID nao informado", http.StatusBadRequest)
		return
	}

	c, err := wsh.upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Printf("erro %s ao atualizar a conexão para websocket", err)
		return
	}
	defer func() {
		wsh.removeClientFromChannel(id, c)
		log.Println("Conexao encerrada com o cliente")
		err := c.Close()
		if err != nil {
			return
		}
	}()

	wsh.addClientToChannel(id, c)

	for {
		var msg Message
		err := c.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error %s when reading message from client", err)
			return
		}

		log.Printf("Mensagem recebida: %+v", msg)
		wsh.broadcastToChannel(id, msg)
	}
}

func (wsh *webSocketHandler) addClientToChannel(id string, client *websocket.Conn) {
	wsh.mu.Lock()
	defer wsh.mu.Unlock()

	if wsh.users[id] == nil {
		wsh.users[id] = make(map[*websocket.Conn]bool)
	}
	wsh.users[id][client] = true
}

func (wsh *webSocketHandler) removeClientFromChannel(id string, client *websocket.Conn) {
	wsh.mu.Lock()
	defer wsh.mu.Unlock()

	if clients, ok := wsh.users[id]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(wsh.users, id)
		}
	}
}

func (wsh *webSocketHandler) broadcastToChannel(id string, msg Message) {
	wsh.mu.Lock()
	defer wsh.mu.Unlock()

	for client := range wsh.users[id] {
		err := client.WriteJSON(msg)
		if err != nil {
			log.Printf("Erro %s ao enviar mensagem", err)
			err := client.Close()
			if err != nil {
				return
			}
			delete(wsh.users[id], client)
		}
	}
}

func main() {
	wsh := newWebSocketHandler()
	http.Handle("/ws", wsh)
	log.Print("Iniciando Servidor...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
