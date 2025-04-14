export interface GeocodingRequest {
  address: string;
}

export interface GeocodingResponse {
  latitude: number;
  longitude: number;
  address: string;
  success: boolean;
  error?: string;
}
