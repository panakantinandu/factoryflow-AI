package com.factoryflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlarmRequest {

    @NotBlank(message = "operator_input is required")
    private String operatorInput;

    private String shift;

    private String machineName;
}
