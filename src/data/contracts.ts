export interface MonthlyValue {
  month: string;
  value: number;
}

export interface ContractRow {
  id: string;
  section: "VIC New" | "VIC Sales New" | "QLD" | "NSW/SA";
  kind: "supply" | "demand";
  contractName: string;
  startDate: string;
  endDate: string;
  acq?: string;
  mdq?: string;
  minDQ?: string;
  dcq?: string;
  topPercent?: string;
  deliveryPoints: string;
  nominations?: string;
  price: string;
  other?: string;
  monthly?: MonthlyValue[];
  totalAcq?: string;
}

export interface CfdRow {
  startDate: string;
  endDate: string;
  buySell: 1 | -1;
  strike: string;
  volumeGJ: number;
  tradeType: string;
  counterparty: string;
  status: string;
  marketRegion: string;
  productComponent: string;
  tradeDate: string;
  comments?: string;
}

export interface QuarterlyCapacity {
  period: string;
  sydBuyTJDay: number;
  vicSellTJDay: number;
}

export interface ContractsData {
  supply: ContractRow[];
  demand: ContractRow[];
  cfds: { sell: CfdRow[]; buy: CfdRow[] };
  quarterlyCapacity: QuarterlyCapacity[];
}
