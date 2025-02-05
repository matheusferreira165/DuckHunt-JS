package main

import (
	"encoding/json"
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
	To          string      `json:"to"`
	Coordinates Coordinates `json:"coordinates"`
}

func newWebSocketHandler() *webSocketHandler {
	return &webSocketHandler{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				allowedOrigins := []string{
					"https://duckhunt-game-0714c09a9b65.herokuapp.com/",
					"https://duckhunt-shoot-c0015710905b.herokuapp.com/",
				}

				origin := r.Header.Get("Origin")
				for _, allowedOrigin := range allowedOrigins {
					if origin == allowedOrigin {
						return true
					}
				}
				return false
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
		_, rawMessage, err := c.ReadMessage()
		if err != nil {
			log.Printf("Erro ao ler mensagem bruta: %v", err)
			return
		}

		var msg Message
		err = json.Unmarshal(rawMessage, &msg)
		if err != nil {
			log.Printf("Erro desserelizar JSON: %v", err)
			continue
		}

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
	server := &http.Server{
		Addr:    ":8080",
		Handler: nil,
	}

	log.Print("Servidor Iniciado")
	log.Fatal(server.ListenAndServe())
}
