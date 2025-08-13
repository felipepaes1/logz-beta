"use client";

import * as React from "react";
import { Model } from "coloquent";
import { HttpClientService } from "@/services/http-client.service";

declare global {
  interface Window {
    __coloquentReady?: boolean;
  }
}

// Executa no carregamento do módulo (antes do render)
(function ensureColoquentHttpClient() {
  const AnyModel = Model as any;

  // Força o client customizado nas APIs mais prováveis
  const client = new HttpClientService();
  AnyModel.httpClient = client;
  AnyModel._effectiveHttpClient = client;
  if (typeof AnyModel.setHttpClient === "function") {
    AnyModel.setHttpClient(client);
  }

  // Sinaliza pronto para debug/validação
  if (typeof window !== "undefined") {
    window.__coloquentReady = true;
  }
})();

export default function ColoquentInit() {
  // Opcional: validação em tempo de execução
  React.useEffect(() => {
    const AnyModel = Model as any;
    if (!(AnyModel?.httpClient instanceof HttpClientService)) {
      // Log visível para você no DevTools se algo sobrescrever depois
      console.warn(
        "[ColoquentInit] httpClient NÃO é HttpClientService ->",
        AnyModel?.httpClient?.constructor?.name
      );
    }
  }, []);
  return null;
}
