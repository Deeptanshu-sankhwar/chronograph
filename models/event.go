package models

type ParentRef struct {
	UID string `json:"uid"`
}

type Event struct {
	UID    string      `json:"uid,omitempty"`
	ID     string      `json:"event.id,omitempty"`
	Name   string      `json:"event.name,omitempty"`
	Clock  string      `json:"event.clock,omitempty"`
	Depth  int         `json:"event.depth,omitempty"`
	Parent []ParentRef `json:"event.parent,omitempty"`
}
