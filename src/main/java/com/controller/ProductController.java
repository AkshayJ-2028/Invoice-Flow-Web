package com.invoiceflow.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.invoiceflow.entity.Product;
import com.invoiceflow.repository.ProductRepository;
import com.invoiceflow.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final CurrentUser currentUser;

    public ProductController(ProductRepository productRepository, CurrentUser currentUser) {
        this.productRepository = productRepository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Product> list() {
        return productRepository.findByUserId(currentUser.id());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> get(@PathVariable Long id) {
        return productRepository.findByIdAndUserId(id, currentUser.id())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Product create(@Valid @RequestBody Product body) {
        body.setId(null);
        body.setUserId(currentUser.id());
        return productRepository.save(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @Valid @RequestBody Product body) {
        return productRepository.findByIdAndUserId(id, currentUser.id()).map(existing -> {
            existing.setName(body.getName());
            existing.setDescription(body.getDescription());
            existing.setUnitPrice(body.getUnitPrice());
            existing.setTaxPercent(body.getTaxPercent());
            return ResponseEntity.ok(productRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return productRepository.findByIdAndUserId(id, currentUser.id()).map(p -> {
            productRepository.delete(p);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}