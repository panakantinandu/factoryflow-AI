package com.factoryflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AlarmFrequency {

    @JsonProperty("alarm_code")
    private String alarmCode;

    private long count;
}
