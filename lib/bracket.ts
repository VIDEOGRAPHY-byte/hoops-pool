import type { Series, Round, Conference } from "./types";

export interface RoundGroup {
  round: Round;
  label: string;
  east: Series[];
  west: Series[];
  finals?: Series;
}