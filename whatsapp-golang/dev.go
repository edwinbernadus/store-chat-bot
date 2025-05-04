package main

import (
	"fmt"
	"github.com/joho/godotenv"
	"golang.org/x/net/context"
	"log"
	"os"
)

func logEnv(input string) {
	// Load .env file (it will look for .env in the current directory)
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	env1 := os.Getenv(input)
	fmt.Println(input+": ", env1)
}

func testRedisPublish() {
	rdb := getRedis()

	var ctx = context.Background()
	err := rdb.Publish(ctx, "channel1", "Hello Redis!").Err()
	if err != nil {
		panic(err)
	}

	fmt.Println("Message published")
}
