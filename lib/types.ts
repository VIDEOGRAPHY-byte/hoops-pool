export type Conference = "East" | "West";
export type Round = 1 | 2 | 3 | 4;

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  seed: number;
  conference: Conference;
  logo_url?: string;
}