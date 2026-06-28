import { api } from "../api/client";
import type { ExperienceResponse } from "../api/client";
import { encryptContent } from "./vaultCrypto";

export async function runMigration(
    masterKey: CryptoKey,
    setMsg?: (msg: string) => void,
): Promise<void> {

    setMsg?.("Checking for historical plaintext entries...");

    const res = await api.get<ExperienceResponse[]>("/experiences/legacy");
    const legacy = res.data;

    if (legacy.length === 0) {
        setMsg?.("No legacy entries found.");
        return;
    }

    setMsg?.(`Securing ${legacy.length} historical entries...`);

    for (let i = 0; i < legacy.length; i++) {

        const entry = legacy[i];

        setMsg?.(`Encrypting ${i + 1}/${legacy.length}`);

        const encrypted = await encryptContent(
            entry.markdownContent,
            masterKey
        );

        await api.put(`/experiences/${entry.id}`, {
            markdownContent: encrypted,
            sensitive: entry.sensitive,
            clientEncrypted: true,
            tags: entry.tags,
        });
    }

    setMsg?.("Migration complete.");
}