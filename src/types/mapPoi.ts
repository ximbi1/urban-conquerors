export type MapPoiCategory = 'park' | 'fountain' | 'district';

export interface StoredMapPoi {
  id: string;
  name: string;
  category: MapPoiCategory;
  coordinates: { lat: number; lng: number }[];
  created_at?: string;
}
