"use client";

import { useEffect } from "react";

export function CacheCleaner() {
  useEffect(() => {
    // Função para limpar caches e dados obsoletos ao iniciar a aplicação
    const cleanAppCache = async () => {
      console.log("[CacheCleaner] Iniciando limpeza de cache e dados locais...");

      // 1. Limpar caches de armazenamento local que não sejam essenciais (login/tema)
      // Preservamos 'staffSession' e 'theme' para não prejudicar a UX básica
      const keysToKeep = ["staffSession", "theme", "clientSession"];
      
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && !keysToKeep.includes(key)) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          console.log(`[CacheCleaner] Removido do localStorage: ${key}`);
        });

        // 2. Tentar limpar Cache Storage API se disponível
        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys.map((key) => {
              console.log(`[CacheCleaner] Removendo cache: ${key}`);
              return caches.delete(key);
            })
          );
        }

        console.log("[CacheCleaner] Limpeza concluída com sucesso.");
      } catch (error) {
        console.error("[CacheCleaner] Erro ao limpar cache:", error);
      }
    };

    cleanAppCache();
  }, []);

  return null;
}
