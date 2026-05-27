import { useCallback, useState } from 'react';
import { searchImages, type ImageResult } from '../services/imageService';

interface State {
  results: ImageResult[];
  loading: boolean;
  error: string | null;
}

export function useImageSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState<State>({
    results: [],
    loading: false,
    error: null,
  });

  const search = useCallback(async (q: string) => {
    setQuery(q);
    setState({ results: [], loading: true, error: null });
    try {
      const results = await searchImages(q);
      setState({ results, loading: false, error: null });
    } catch (e: any) {
      setState({ results: [], loading: false, error: e.message ?? '搜索失败' });
    }
  }, []);

  return { query, search, ...state };
}
