export type Project = {
  slug: string;
  number: string;
  title: string;
  location: string;
  year: string;
  category: string;
  categorySlug: 'residential' | 'kitchens' | 'living' | 'complete-homes';
  area: string;
  excerpt: string;
  description: string;
  materials: string[];
  hero: string;
  images: string[];
};

export const projects: Project[] = [
  {
    slug: 'kalyan-kitchen',
    number: '01',
    title: 'Kitchen Project, Kalyan',
    location: 'Kalyan, Maharashtra',
    year: '2026',
    category: 'Residential • Kitchen',
    categorySlug: 'kitchens',
    area: 'Custom Layout',
    excerpt:
      'A functional, warm kitchen designed with clean cabinetry, stone countertops and considered storage — built for everyday living in Kalyan.',
    description:
      'This kitchen project in Kalyan balances architectural practicality with warm, tactile materiality. Structured fluted and lacquered cabinetry, honed stone surfaces, and carefully chosen brass and stainless hardware create an environment that is as effortless to prepare food in as it is calming to experience.',
    materials: [
      'Honed Stone Countertop',
      'Lacquered & Oak Cabinetry',
      'Brushed Stainless Steel',
      'Handcrafted Ceramic Tile',
    ],
    hero: '/images/kalyan-kitchen-01.jpeg',
    images: [
      '/images/kalyan-kitchen-01.jpeg',
      '/images/kalyan-kitchen-02.jpeg',
      '/images/kalyan-kitchen-03.jpeg',
      '/images/kalyan-kitchen-04.jpeg',
    ],
  },
];
