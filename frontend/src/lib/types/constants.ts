const ITEMS_PER_PAGE = 20

export {ITEMS_PER_PAGE};

export const LEAD_STATUSES = [
  'pending',
  'processed',
  'invalid',
  'skipped',
  'valid',
  
] as const;


export const LEAD_TEMPERATURE = [
    "hot",
    "warm",
    "cold"
] as const;


export const LEAD_STAGES = [
    "new",
    "contacted",
    "qualified",
    "converted",
    "unqualified",
    "booked"
] as const;
