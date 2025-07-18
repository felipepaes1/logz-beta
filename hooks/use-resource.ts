import * as React from "react";
import { BaseResource } from "@/base/BaseResource";

export interface ResourceClass<T extends BaseResource> {
  query: () => any;
  where: (field: string, value: any) => any;
  jsonApiType: string;
}

export function useResource<T extends BaseResource>(resource: ResourceClass<T>, defaultTerm = "") {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [term, setTerm] = React.useState(defaultTerm);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = resource.query();
      if (term) {
        query = resource.where("term", term);
      }
      const response = await query.get();
      if (typeof response.getData === "function") {
        setData(response.getData());
      } else if (Array.isArray(response.data)) {
        setData(response.data as T[]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [resource, term]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    term,
    setTerm,
  };
}
