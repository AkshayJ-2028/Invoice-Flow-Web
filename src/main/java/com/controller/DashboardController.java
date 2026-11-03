package com.invoiceflow.controller;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.invoiceflow.entity.Invoice;
import com.invoiceflow.repository.InvoiceRepository;
import com.invoiceflow.security.CurrentUser;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final InvoiceRepository invoiceRepository;
    private final CurrentUser currentUser;

    public DashboardController(InvoiceRepository invoiceRepository, CurrentUser currentUser) {
        this.invoiceRepository = invoiceRepository;
        this.currentUser = currentUser;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<Invoice> all = invoiceRepository.findByUserIdOrderByIdDesc(currentUser.id());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalInvoices", all.size());
        result.put("totalAmount", sum(all, null));
        result.put("paidAmount", sum(all, "PAID"));
        result.put("pendingAmount", sum(all, "SENT"));
        result.put("overdueAmount", sum(all, "OVERDUE"));
        result.put("draftCount", all.stream().filter(i -> "DRAFT".equals(i.getStatus())).count());
        return result;
    }

    private BigDecimal sum(List<Invoice> list, String status) {
        return list.stream()
                .filter(i -> status == null || status.equals(i.getStatus()))
                .map(Invoice::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}