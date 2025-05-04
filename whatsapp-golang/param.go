package main

import (
	"github.com/redis/go-redis/v9"
	"log"
	"os"
)

func getDbSourceName() string {
	dataSource := os.Getenv("DATA_SOURCE")
	return dataSource
}

func getRedis() *redis.Client {
	redisConnString := os.Getenv("REDIS_URL")
	opt, err1 := redis.ParseURL(redisConnString)
	if err1 != nil {
		log.Fatalf("failed to parse redis URL: %v", err1)
	}
	rdb := redis.NewClient(opt)

	return rdb
}

func checkEnv() {
	dataSource := os.Getenv("DATA_SOURCE")
	log.Printf("DATA_SOURCE: %s", dataSource)
	if dataSource == "" {
		panic("DATA_SOURCE environment variable is not set")
	}
	redisConnString := os.Getenv("REDIS_URL")
	log.Printf("REDIS_URL: %s", redisConnString)
	if redisConnString == "" {
		panic("REDIS_URL environment variable is not set")
	}
}
