import type { ItemType, Quality, SynergyStatus } from "@/lib/ui";

export type SearchResult = {
  id: string;
  name: string;
  type: ItemType;
  quality: Quality;
  description: string;
  quote: string | null;
  imageUrl: string | null;
  owned: boolean;
  synergyCount: number;
  activatesCount: number;
  activeCount: number;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
  hasRun: boolean;
};

export type SynergyEvaluationView = {
  id: string;
  name: string;
  effect: string;
  status: SynergyStatus;
  satisfiedGroups: number;
  requiredGroups: number;
  contributors: { id: string; name: string; quality: Quality; imageUrl: string | null }[];
  needed: {
    groupIndex: number;
    options: { id: string; name: string; quality: Quality; imageUrl: string | null }[];
  }[];
};

export type RunView = {
  runId: string;
  name: string;
  items: {
    id: string;
    name: string;
    type: ItemType;
    quality: Quality;
    description: string;
    quote: string | null;
    imageUrl: string | null;
  }[];
  active: SynergyEvaluationView[];
  nearly: SynergyEvaluationView[];
  counts: { items: number; guns: number; passives: number; actives: number };
};

export type ItemDetailSynergy = {
  id: string;
  name: string;
  effect: string;
  status: SynergyStatus;
  activatesOnAdd: boolean;
  requiredGroups: number;
  satisfiedGroups: number;
  groups: {
    index: number;
    satisfied: boolean;
    items: { id: string; name: string; type: ItemType; quality: Quality; owned: boolean }[];
  }[];
};

export type ItemDetail = {
  item: {
    id: string;
    name: string;
    type: ItemType;
    quality: Quality;
    description: string;
    quote: string | null;
    imageUrl: string | null;
    owned: boolean;
  };
  synergies: ItemDetailSynergy[];
};
