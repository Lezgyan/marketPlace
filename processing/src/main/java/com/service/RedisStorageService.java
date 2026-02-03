package com.service;

import com.dto.DtoRedis;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

@Service
public class RedisStorageService {

    RedisTemplate<String, DtoRedis> redis;

    public RedisStorageService(RedisTemplate<String, DtoRedis> redis){
        this.redis = redis;
    }

    public void putRedis(DtoRedis dtoRedis){
        redis.opsForValue().set(dtoRedis.getKey(), dtoRedis, Duration.of(10, ChronoUnit.MINUTES));
    }

    public DtoRedis takeRedis(String key){
        return redis.opsForValue().get(key);
    }

    public void deleteKey(String key){
        redis.delete(key);
    }

    public void expireTTL(String key){
        redis.expire(key, Duration.of(10, ChronoUnit.MINUTES));
    }

}
