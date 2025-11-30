export interface Plan {
  name: string;
  plan: string; 
  tagline: string;
  description: string;
  price: string;
  amountInPaisa: number; 
  priceDetails?: string;
  features: string[];
  buttonText: string;
  isRecommended?: boolean;
  isCustom?: boolean;
}