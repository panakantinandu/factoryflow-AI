package com.factoryflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${agent.service.url}")
    private String agentServiceUrl;

    @Bean
    public WebClient agentWebClient() {
        return WebClient.builder()
                .baseUrl(agentServiceUrl)
                .defaultHeader("Content-Type", "application/json")
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                .build();
    }
}
