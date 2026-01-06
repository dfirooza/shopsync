export interface Business {
  id: number;
  name: string;
  category: string;
  address: string;
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
