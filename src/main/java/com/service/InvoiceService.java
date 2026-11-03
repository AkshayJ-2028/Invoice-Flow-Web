package com.invoiceflow.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.invoiceflow.dto.InvoiceRequest;
import com.invoiceflow.entity.Client;
import com.invoiceflow.entity.Invoice;
import com.invoiceflow.entity.InvoiceItem;
import com.invoiceflow.entity.Product;
import com.invoiceflow.repository.ClientRepository;
import com.invoiceflow.repository.InvoiceRepository;
import com.invoiceflow.repository.ProductRepository;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final ProductRepository productRepository;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          ClientRepository clientRepository,
                          ProductRepository productRepository) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Invoice create(InvoiceRequest req, Long userId) {
        Client client = clientRepository.findByIdAndUserId(req.clientId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));

        Invoice invoice = new Invoice();
        invoice.setUserId(userId);
        invoice.setClientId(client.getId());
        invoice.setClientName(client.getName());
        invoice.setIssueDate(req.issueDate() != null ? req.issueDate() : LocalDate.now());
        invoice.setDueDate(req.dueDate() != null ? req.dueDate() : invoice.getIssueDate().plusDays(15));
        invoice.setNotes(req.notes());
        invoice.setStatus("DRAFT");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (InvoiceRequest.ItemRequest r : req.items()) {
            InvoiceItem item = new InvoiceItem();
            BigDecimal price = r.unitPrice();
            BigDecimal taxPercent = r.taxPercent();
            String description = r.description();

            if (r.productId() != null) {
                Product p = productRepository.findByIdAndUserId(r.productId(), userId)
                        .orElseThrow(() -> new IllegalArgumentException("Product not found"));
                if (price == null) price = p.getUnitPrice();
                if (taxPercent == null) taxPercent = p.getTaxPercent();
                if (description == null || description.isBlank()) description = p.getName();
                item.setProductId(p.getId());
            }
            if (price == null) throw new IllegalArgumentException("Unit price is required");
            if (taxPercent == null) taxPercent = BigDecimal.ZERO;

            BigDecimal base = price.multiply(BigDecimal.valueOf(r.quantity()));
            BigDecimal lineTax = base.multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            item.setDescription(description);
            item.setQuantity(r.quantity());
            item.setUnitPrice(price);
            item.setTaxPercent(taxPercent);
            item.setLineTotal(base.add(lineTax).setScale(2, RoundingMode.HALF_UP));
            invoice.getItems().add(item);

            subtotal = subtotal.add(base);
            taxTotal = taxTotal.add(lineTax);
        }

        BigDecimal discount = req.discount() != null ? req.discount() : BigDecimal.ZERO;
        invoice.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        invoice.setTaxTotal(taxTotal.setScale(2, RoundingMode.HALF_UP));
        invoice.setDiscount(discount.setScale(2, RoundingMode.HALF_UP));
        invoice.setGrandTotal(subtotal.add(taxTotal).subtract(discount).setScale(2, RoundingMode.HALF_UP));

        long next = invoiceRepository.countByUserId(userId) + 1;
        invoice.setInvoiceNumber(String.format("INV-%d-%04d", invoice.getIssueDate().getYear(), next));

        return invoiceRepository.save(invoice);
    }
}