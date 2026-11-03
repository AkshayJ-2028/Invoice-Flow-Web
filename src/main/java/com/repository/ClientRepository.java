package com.invoiceflow.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.invoiceflow.entity.Client;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByUserId(Long userId);
    Optional<Client> findByIdAndUserId(Long id, Long userId);
}