/**
 * Last.fm API response types
 * This file contains all the TypeScript interfaces for the Last.fm API responses.
 */

/**
 * Basic artist information in a track
 */
export interface LastfmArtist {
  name: string;
  mbid?: string;
  url?: string;
}

/**
 * Image from Last.fm API
 */
export interface LastfmImage {
  size: "small" | "medium" | "large" | "extralarge";
  "#text": string;
}

/**
 * Date information for a track
 */
export interface LastfmDate {
  uts: string;
  text?: string;
}

/**
 * Base track information returned by Last.fm API
 */
export interface LastfmTrack {
  name: string;
  artist: LastfmArtist;
  url: string;
  mbid?: string;
  playcount?: number;
  listeners?: number;
  image: LastfmImage[];
  date?: LastfmDate;
}

/**
 * Track with simpler format used for frequent track display
 */
export interface FrequentTrack {
  name: string;
  artist: string;
  playcount: number;
}

/**
 * Main response from the songs API endpoint
 */
export interface LastfmResponse {
  recentTracks: LastfmTrack[];
  frequentRecent: FrequentTrack[];
  topMonthly: LastfmTrack[];
}
