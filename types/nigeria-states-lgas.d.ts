declare module "nigeria-states-lgas" {
  export interface StateData {
    state: string;
    senatorial_districts: string[];
    lgas: string[];
  }

  export function all(): StateData[];
  export function states(): string[];
  export function lgas(): string[];
  export function senatorialDistricts(): string[];
}
