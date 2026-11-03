package com.invoiceflow.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.invoiceflow.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByUserIdOrderByIdDesc(Long userId);
    Optional<Invoice> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}