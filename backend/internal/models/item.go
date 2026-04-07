package models

import "encoding/json"

type Item struct {
	ID          int                    `json:"id"`
	Name        string                 `json:"name"`
	Category    string                 `json:"category"`
	Quantity    int                    `json:"quantity"`
	Location    string                 `json:"location"`
	Details     map[string]interface{} `json:"details"`
	EncargadoID *int                   `json:"encargado_id"`
	Encargado   string                 `json:"encargado"`
}

func (i *Item) DetailsToJSON() string {
	if i.Details == nil {
		return "{}"
	}
	b, _ := json.Marshal(i.Details)
	return string(b)
}

func (i *Item) DetailsFromJSON(s string) {
	i.Details = map[string]interface{}{}
	if s != "" && s != "{}" {
		json.Unmarshal([]byte(s), &i.Details)
	}
}
