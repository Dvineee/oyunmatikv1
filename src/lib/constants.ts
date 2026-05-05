import { 
  Bird, 
  Cat, 
  Dog, 
  Fish, 
  Rabbit, 
  Turtle 
} from 'lucide-react';

export interface AvatarPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const AVATARS = [
  { id: 'animal_1', name: 'Tavşan', color: 'bg-[#5856D6]', icon: Rabbit, accent: '#8E8E93' },
  { id: 'animal_2', name: 'Kedi', color: 'bg-[#FF9500]', icon: Cat, accent: '#FFCC00' },
  { id: 'animal_3', name: 'Köpek', color: 'bg-[#FF3B30]', icon: Dog, accent: '#FF453A' },
  { id: 'animal_4', name: 'Kuş', color: 'bg-[#007AFF]', icon: Bird, accent: '#64D2FF' },
  { id: 'animal_5', name: 'Balık', color: 'bg-[#34C759]', icon: Fish, accent: '#30D158' },
  { id: 'animal_6', name: 'Kaplumbağa', color: 'bg-[#8E8E93]', icon: Turtle, accent: '#D1D1D6' },
];
