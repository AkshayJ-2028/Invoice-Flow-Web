package com.invoiceflow.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record InvoiceRequest(
        @NotNull Long clientId,
        LocalDate issueDate,
        LocalDate dueDate,
        BigDecimal discount,
        String notes,
        @NotEmpty @Valid List<ItemRequest> items) {

    public record ItemRequest(
            Long productId,
            String description,
            @Positive int quantity,
            BigDecimal unitPrice,
            BigDecimal taxPercent) {
    }
}