import { BaseResource } from "@/base/BaseResource";

/**
 * Recurso dedicado às rotas de dashboard.
 * Padrão do projeto: jsonApiType com placeholder de tenant.
 */
export class DashboardPanoramaResource extends BaseResource {
  public static jsonApiType: string = "tenants/:tenant_id/dashboard";

  /**
   * GET /tenants/{tenant_id}/dashboard/panorama
   * Retorna o payload agregado (cards, séries e tops) exatamente como o backend envia.
   */
  public static async panorama(params?: { date_from?: string; date_to?: string }) {
    const uri = (this as any).jsonApiType + "/panorama";
    // Usa o HttpClientService (headers, auth, tenancy etc. já configurados)
    const response = await this.getHttpClient().get(uri, params);
    // O backend já está no formato { type, id, attributes } pelo BaseResource do backend.
    // Aqui retornamos apenas os attributes para simplificar o uso no front.
    const data = (response as any)?.axiosResponse?.data;
    const attributes = data?.data?.attributes ?? data?.attributes ?? data;
    return attributes as DashboardPanoramaAttributes;
  }
}

/** Tipos (DTO “levinho”, apenas interfaces TS) */
export interface SeriePoint {
  period: string;   // 'YYYY-MM'
  consumo: number;  // R$
  compra: number;   // R$
}

export interface AlertItem {
  item_id: number;
  code: string;
  name: string;
  qty: number;
  min_qty: number;
}

export interface TopRow {
  key: string;             // id ou "—"
  name: string | null;
  valor: number;           // R$
}

export interface DashboardPanoramaAttributes {
  period: {
    from?: string | null;
    to?: string | null;
    months: string[];
  };
  cards: {
    compras: { total: number; media_mensal: number };
    consumos: { total: number; media_mensal: number };
    estoque_sem_movimentacao: { total: number };
    alertas_preview: AlertItem[];
    eficiencia_compra: { por_mes: Record<string, number> }; // 0..120
    acompanhamento_mes_atual: {
      compras_mes_atual: number;
      consumo_mes_atual: number;
      media_compras_3m: number;
      media_consumo_3m: number;
    };
  };
  series: {
    consumo_x_compras: SeriePoint[];
  };
  tops_mes_atual: {
    collaborators_top3: TopRow[];
    machines_top5: TopRow[];
    items_top5: TopRow[];
  };
  generated_at: string;
  currency: string; // "BRL"
}
