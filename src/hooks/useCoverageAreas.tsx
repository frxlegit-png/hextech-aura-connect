import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CoverageArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: string;
}

export const useCoverageAreas = () => {
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAreas = async () => {
      const { data, error } = await supabase
        .from('coverage_areas')
        .select('*')
        .order('name');

      if (error) {
        setError(error.message);
      } else {
        setAreas(data || []);
      }
      setIsLoading(false);
    };

    fetchAreas();
  }, []);

  return { areas, isLoading, error };
};
