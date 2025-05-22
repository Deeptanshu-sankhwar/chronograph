package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/Deeptanshu-sankhwar/chronograph/dgraph"
	"github.com/Deeptanshu-sankhwar/chronograph/models"
	"github.com/dgraph-io/dgo/v210/protos/api"
)

func main() {
	dgraph.InitDgraph("localhost:9080")
	GenerateChronoEvents()
}

func maxClock(a, b []int) []int {
	res := make([]int, len(a))
	for i := range a {
		if a[i] > b[i] {
			res[i] = a[i]
		} else {
			res[i] = b[i]
		}
	}
	return res
}

func vectorClockToString(vc []int) string {
	b, _ := json.Marshal(vc)
	return string(b)
}

// Initialize vector clocks with an experimental setup
func GenerateChronoEvents() {
	clocks := map[string][]int{
		"n1": {0, 0, 0},
		"n2": {0, 0, 0},
		"n3": {0, 0, 0},
	}

	var events []models.Event
	uidMap := map[string]string{}

	clocks["n1"][0]++
	clocks["n2"] = maxClock(clocks["n2"], clocks["n1"])
	clocks["n2"][1]++
	e1 := models.Event{
		UID:   "_:e1",
		ID:    "e1",
		Name:  "m1 received",
		Clock: vectorClockToString(clocks["n2"]),
		Depth: 1,
	}
	events = append(events, e1)
	uidMap["e1"] = e1.UID

	clocks["n1"][0]++
	clocks["n2"] = maxClock(clocks["n2"], clocks["n1"])
	clocks["n2"][1]++
	e2 := models.Event{
		UID:   "_:e2",
		ID:    "e2",
		Name:  "m2 received",
		Clock: vectorClockToString(clocks["n2"]),
		Depth: 2,
		Parent: []models.ParentRef{
			{UID: uidMap["e1"]},
		},
	}
	events = append(events, e2)
	uidMap["e2"] = e2.UID

	clocks["n2"][1]++
	clocks["n1"] = maxClock(clocks["n1"], clocks["n2"])
	clocks["n1"][0]++
	e3 := models.Event{
		UID:   "_:e3",
		ID:    "e3",
		Name:  "m3 received",
		Clock: vectorClockToString(clocks["n1"]),
		Depth: 3,
		Parent: []models.ParentRef{
			{UID: uidMap["e2"]},
		},
	}
	events = append(events, e3)
	uidMap["e3"] = e3.UID

	clocks["n3"][2]++
	clocks["n2"] = maxClock(clocks["n2"], clocks["n3"])
	clocks["n2"][1]++
	e4 := models.Event{
		UID:   "_:e4",
		ID:    "e4",
		Name:  "m4 received",
		Clock: vectorClockToString(clocks["n2"]),
		Depth: 4,
		Parent: []models.ParentRef{
			{UID: uidMap["e2"]},
		},
	}
	events = append(events, e4)
	uidMap["e4"] = e4.UID

	clocks["n2"][1]++
	clocks["n1"] = maxClock(clocks["n1"], clocks["n2"])
	clocks["n1"][0]++
	e5 := models.Event{
		UID:   "_:e5",
		ID:    "e5",
		Name:  "m5 received",
		Clock: vectorClockToString(clocks["n1"]),
		Depth: 5,
		Parent: []models.ParentRef{
			{UID: uidMap["e3"]},
			{UID: uidMap["e4"]},
		},
	}
	events = append(events, e5)
	uidMap["e5"] = e5.UID

	clocks["n1"][0]++
	clocks["n3"] = maxClock(clocks["n3"], clocks["n1"])
	clocks["n3"][2]++
	e6 := models.Event{
		UID:   "_:e6",
		ID:    "e6",
		Name:  "m6 received",
		Clock: vectorClockToString(clocks["n3"]),
		Depth: 6,
		Parent: []models.ParentRef{
			{UID: uidMap["e5"]},
		},
	}
	events = append(events, e6)

	mutationJSON, err := json.Marshal(events)
	if err != nil {
		panic(err)
	}

	txn := dgraph.Dg.NewTxn()
	defer txn.Discard(context.Background())
	mu := &api.Mutation{
		SetJson:   mutationJSON,
		CommitNow: true,
	}
	if _, err := txn.Mutate(context.Background(), mu); err != nil {
		panic(err)
	}

	fmt.Println("Chrono event graph committed to Dgraph.")
}
