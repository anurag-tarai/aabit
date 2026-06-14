package com.aabit.backend.experience.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheck {

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck(@RequestParam String name){
        return new ResponseEntity<>("Hi " + name, HttpStatus.OK);
    }
}
