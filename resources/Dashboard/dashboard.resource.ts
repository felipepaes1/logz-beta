import { BaseResource } from "@/base/BaseResource";


export class DashboardPanoramaResource extends BaseResource {
  public static jsonApiType: string = "tenants/:tenant_id/dashboard";

  private static _inflight = new Map<string, Promise<DashboardPanoramaAttributes>>();
  private static _cache = new Map<string, { exp: number; data: DashboardPanoramaAttributes }>();
  private static _ttlMs = 30_000;

  private static _key(params?: { date_from?: string | null; date_to?: string | null }) {
    return JSON.stringify(params ?? {});
  }

  public static clearCache() {
    this._inflight.clear();
    this._cache.clear();
  }

  public static async panorama(params?: { date_from?: string | null; date_to?: string | null }) {
    const uri = (this as any).jsonApiType + "/panorama";
    const key = this._key(params);

    const cached = this._cache.get(key);
    const now = Date.now();
    if (cached && cached.exp > now) return cached.data;

    const existing = this._inflight.get(key);
    if (existing) return existing;

    const p = (async () => {
      const response = await this.getHttpClient().get(uri, params);
      const data = (response as any)?.axiosResponse?.data;
      const attributes = (data?.data?.attributes ?? data?.attributes ?? data) as DashboardPanoramaAttributes;
      this._cache.set(key, { exp: now + this._ttlMs, data: attributes });
      this._inflight.delete(key);
      return attributes;
    })().catch((e) => {
      this._inflight.delete(key);
      throw e;
    });

    this._inflight.set(key, p);
    return p;
  }
}


export interface SeriePoint {
  period: string;   
  consumo: number;  
  compra: number;   
}

export interface AlertItem {
  item_id: number;
  code: string;
  name: string;
  qty: number;
  min_qty: number;
}

export interface TopRow {
  key: string;            
  name: string | null;
  valor: number;          
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
    eficiencia_compra: { por_mes: Record<string, number> };
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
  currency: string; 
}
