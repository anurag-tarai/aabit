package com.aabit.backend.auth.dto;

public record VaultMetadataResponse(
        String vaultPinWrapped,
        String vaultPhraseWrapped
) {}
