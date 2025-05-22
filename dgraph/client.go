package dgraph

import (
	"context"
	"fmt"
	"log"

	"github.com/dgraph-io/dgo/v210"
	"github.com/dgraph-io/dgo/v210/protos/api"
	"google.golang.org/grpc"
)

var Dg *dgo.Dgraph

func InitDgraph(dgraphURL string) {
	conn, err := grpc.Dial(dgraphURL, grpc.WithInsecure())
	if err != nil {
		log.Fatal(err)
	}
	Dg = dgo.NewDgraphClient(api.NewDgraphClient(conn))
	fmt.Println("Connected to Dgraph")

	op := &api.Operation{
		Schema: `
		event.id: string @index(exact) .
		event.name: string .
		event.clock: string .
		event.depth: int .
		event.parent: [uid] @reverse .
		`,
	}
	if err := Dg.Alter(context.Background(), op); err != nil {
		log.Fatal("Error setting up schema:", err)
	}
}
