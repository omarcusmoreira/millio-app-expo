import React from 'react';
import { Home, Receipt, Wallet, Users, Plus } from 'lucide-react-native';

interface Props {
  color: string;
  size?: number;
}

export function HomeIcon({ color, size = 24 }: Props) {
  return <Home color={color} size={size} strokeWidth={1.5} />;
}

export function BillsIcon({ color, size = 24 }: Props) {
  return <Receipt color={color} size={size} strokeWidth={1.5} />;
}

export function SilosIcon({ color, size = 24 }: Props) {
  return <Wallet color={color} size={size} strokeWidth={1.5} />;
}

export function LarIcon({ color, size = 24 }: Props) {
  return <Users color={color} size={size} strokeWidth={1.5} />;
}

export function AddIcon({ color, size = 26 }: Props) {
  return <Plus color={color} size={size} strokeWidth={2} />;
}
