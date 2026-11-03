package com.invoiceflow.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.invoiceflow.repository.InvoiceRepository;
import com.invoiceflow.security.CurrentUser;
import com.invoiceflow.service.PdfService;

@RestController
@RequestMapping("/api/invoices")
public class InvoicePdfController {

    private final InvoiceRepository invoiceRepository;
    private final PdfService pdfService;
    private final CurrentUser currentUser;

    public InvoicePdfController(InvoiceRepository invoiceRepository,
                                PdfService pdfService,
                                CurrentUser currentUser) {
        this.invoiceRepository = invoiceRepository;
        this.pdfService = pdfService;
        this.currentUser = currentUser;
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        return invoiceRepository.findByIdAndUserId(id, currentUser.id()).map(invoice -> {
            byte[] bytes = pdfService.generate(invoice);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(bytes);
        }).orElse(ResponseEntity.notFound().build());
    }
}