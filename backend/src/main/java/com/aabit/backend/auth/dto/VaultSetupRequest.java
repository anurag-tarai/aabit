package com.aabit.backend.auth.dto;

public record VaultSetupRequest(
        String vaultPinWrapped,
        String vaultPhraseWrapped
) {}
