package com.client;

import com.example.ranker.grpc.RankRequest;
import com.example.ranker.grpc.RankResponse;
import com.example.ranker.grpc.RankerServiceGrpc;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

@Component
public class RankerGrpcClient {

    private final ManagedChannel channel;
    private final RankerServiceGrpc.RankerServiceBlockingStub blockingStub;

    public RankerGrpcClient() {
        this.channel = ManagedChannelBuilder
                .forAddress("127.0.0.1", 8001)
                .usePlaintext()
                .maxInboundMessageSize(50 * 1024 * 1024)
                .build();

        this.blockingStub = RankerServiceGrpc.newBlockingStub(channel)
                .withMaxInboundMessageSize(50 * 1024 * 1024);
    }

    public RankResponse rank(RankRequest request) {
        return blockingStub.rank(request);
    }

    @PreDestroy
    public void shutdown() {
        channel.shutdown();
    }
}