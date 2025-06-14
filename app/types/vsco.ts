/**
 * Basic image information in a VSCO media item
 */
export interface VscoMediaImage {
  responsive_url: string;
  capture_date: number;
  upload_date: number;
  is_video?: boolean;
}

/**
 * A single media item from VSCO API
 */
export interface VscoMediaItem {
  type: string;
  image: VscoMediaImage;
}

/**
 * Response from VSCO /medias/profile endpoint
 */
export interface VscoMediaResponse {
  media: VscoMediaItem[];
  previous_cursor?: string | null;
}

/**
 * Main response from the photos API endpoint
 */
export interface VscoImage {
  photo_url: string;
  date: number;
}
