import {
  Baby, Bed, Bike, BookOpen, Brush, Car, Cat, CookingPot, Dog, Droplets, Dumbbell, Flower2,
  Footprints, Package, Recycle, Shirt, ShoppingBasket, Soup, Sparkles, Sprout, Star, Trash2,
  Utensils, WashingMachine,
} from 'lucide-vue-next'
import type { Component } from 'vue'

// Curated set of chore icons, keyed by Lucide name (this is what is stored in the database).
export const ICONS: Record<string, Component> = {
  Utensils, Soup, CookingPot, WashingMachine, Shirt, Trash2, Recycle, Brush, Sparkles, Droplets,
  Bed, Package, ShoppingBasket, BookOpen, Dog, Cat, Baby, Sprout, Flower2, Car, Bike, Footprints,
  Dumbbell, Star,
}

export const ICON_NAMES = Object.keys(ICONS)

export function iconFor(name: string | null | undefined): Component {
  return (name && ICONS[name]) || Star
}
