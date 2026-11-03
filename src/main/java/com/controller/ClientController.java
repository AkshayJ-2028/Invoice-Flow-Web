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

import com.invoiceflow.entity.Client;
import com.invoiceflow.repository.ClientRepository;
import com.invoiceflow.security.CurrentUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientRepository clientRepository;
    private final CurrentUser currentUser;

    public ClientController(ClientRepository clientRepository, CurrentUser currentUser) {
        this.clientRepository = clientRepository;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<Client> list() {
        return clientRepository.findByUserId(currentUser.id());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> get(@PathVariable Long id) {
        return clientRepository.findByIdAndUserId(id, currentUser.id())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Client create(@Valid @RequestBody Client body) {
        body.setId(null);
        body.setUserId(currentUser.id());
        return clientRepository.save(body);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> update(@PathVariable Long id, @Valid @RequestBody Client body) {
        return clientRepository.findByIdAndUserId(id, currentUser.id()).map(existing -> {
            existing.setName(body.getName());
            existing.setEmail(body.getEmail());
            existing.setPhone(body.getPhone());
            existing.setAddress(body.getAddress());
            existing.setGstNumber(body.getGstNumber());
            return ResponseEntity.ok(clientRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return clientRepository.findByIdAndUserId(id, currentUser.id()).map(c -> {
            clientRepository.delete(c);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}