package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func main() {
	r := mux.NewRouter()

	// Serve static files
	fs := http.FileServer(http.Dir("static"))
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))

	// Serve index.html
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.html")
	})

	// Login endpoint
	r.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var creds Credentials
		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Hardcoded credentials for now
		if creds.Username == "admin" && creds.Password == "admin123" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]bool{"success": true})
		} else {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]bool{"success": false})
		}
	})

	log.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
