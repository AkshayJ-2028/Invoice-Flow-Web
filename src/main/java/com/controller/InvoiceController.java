package com.invoiceflow.controller;

import java.util.List;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.invoiceflow.dto.InvoiceRequest;
import com.invoiceflow.entity.Invoice;
import com.invoiceflow.repository.InvoiceRepository;
import com.invoiceflow.security.CurrentUser;
import com.invoiceflow.service.InvoiceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private static final Set<String> ALLOWED_STATUS =
            Set.of("DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED");

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final CurrentUser currentUser;

    public InvoiceController(InvoiceService invoiceService,
                             InvoiceRepository invoiceRepository,
                             CurrentUser currentUser) {
        this.invoiceService = invoiceService;
        this.invoiceRepository = invoiceRepository;
        this.currentUser = currentUser;
    }

    @PostMapping
    public Invoice create(@Valid @RequestBody InvoiceRequest req) {
        return invoiceService.create(req, currentUser.id());
    }

    @GetMapping
    public List<Invoice> list() {
        return invoiceRepository.findByUserIdOrderByIdDesc(currentUser.id());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> get(@PathVariable Long id) {
        return invoiceRepository.findByIdAndUserId(id, currentUser.id())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Invoice> updateStatus(@PathVariable Long id, @RequestParam String value) {
        String status = value.toUpperCase();
        if (!ALLOWED_STATUS.contains(status)) {
            throw new IllegalArgumentException("Invalid status. Use DRAFT, SENT, PAID, OVERDUE or CANCELLED");
        }
        return invoiceRepository.findByIdAndUserId(id, currentUser.id()).map(invoice -> {
            invoice.setStatus(status);
            return ResponseEntity.ok(invoiceRepository.save(invoice));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return invoiceRepository.findByIdAndUserId(id, currentUser.id()).map(invoice -> {
            invoiceRepository.delete(invoice);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}