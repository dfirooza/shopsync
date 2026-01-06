export interface Business {
  id: number;
  name: string;
  category: string;
  address: string;
}

export interface Product {
  id: number;
  businessId: number;
  name: string;
  price: number;
}

export const businesses: Business[] = [
  {
    id: 1,
    name: "Berkeley Coffee Roasters",
    category: "Café",
    address: "2090 Vine St, Berkeley, CA 94709",
  },
  {
    id: 2,
    name: "Green Earth Grocery",
    category: "Grocery",
    address: "1336 Gilman St, Berkeley, CA 94706",
  },
  {
    id: 3,
    name: "Page & Spine Books",
    category: "Bookstore",
    address: "2484 Telegraph Ave, Berkeley, CA 94704",
  },
  {
    id: 4,
    name: "Bella's Bakery",
    category: "Bakery",
    address: "1719 Solano Ave, Berkeley, CA 94707",
  },
];

export const products: Product[] = [
  { id: 1, businessId: 1, name: "Espresso", price: 3.5 },
  { id: 2, businessId: 1, name: "Latte", price: 4.5 },
  { id: 3, businessId: 1, name: "Cold Brew", price: 4.0 },
  { id: 4, businessId: 2, name: "Organic Apples", price: 5.99 },
  { id: 5, businessId: 2, name: "Sourdough Bread", price: 6.5 },
  { id: 6, businessId: 2, name: "Almond Milk", price: 4.99 },
  { id: 7, businessId: 3, name: "The Great Gatsby", price: 15.99 },
  { id: 8, businessId: 3, name: "1984", price: 14.99 },
  { id: 9, businessId: 3, name: "To Kill a Mockingbird", price: 13.99 },
  { id: 10, businessId: 4, name: "Croissant", price: 3.5 },
  { id: 11, businessId: 4, name: "Blueberry Muffin", price: 4.0 },
  { id: 12, businessId: 4, name: "Chocolate Cake Slice", price: 5.5 },
];
