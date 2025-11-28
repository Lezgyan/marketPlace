import { UUID } from "crypto";

export { type Product };
export type { ProductCardProps };

interface Product {
  id: string;
  name: string;
  dataRow: {
    id: string;
    url: string;
    name: string;
    tags: string[];
    text: string;
    price: number;
    currency: string;
    fetched_at: string;
    picture_urls: string[];
    // Динамические характеристики
    [key: string]: any;
  };
}

interface ProductCardProps {
    product: Product;
    onProductClick: (product: Product) => void;
}

interface SearchResponse {
  items: Product[];
  total?: number;
}