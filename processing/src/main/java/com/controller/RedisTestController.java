package com.controller;

import com.dto.DtoRedis;
import com.service.RedisStorageService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/redis")
public class RedisTestController {

    private final RedisStorageService redis;

    public RedisTestController(RedisStorageService redis) {
        this.redis = redis;
    }

    @PostMapping("/set")
    public String set(@RequestBody DtoRedis dtoRedis) {
        redis.putRedis(dtoRedis);
        return "OK";
    }

    @GetMapping("/get")
    public DtoRedis get(@RequestParam String key) {
        return redis.takeRedis(key);
    }

    @DeleteMapping("/del")
    public void del(@RequestParam String key){
        redis.deleteKey(key);
    }
}