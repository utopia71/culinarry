import type { Recipe, Review } from "./types.js";
const STORAGE_KEY = "culinary-recipes";
const CATEGORIES = ["Завтрак", "Обед", "Ужин", "Десерт"];

type StoredRecipe = Omit<Recipe, "reviews"> & { reviews?: Review[] };

function isReview(value: unknown): value is Review {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.author === "string" &&
    typeof item.text === "string" &&
    typeof item.likes === "number" &&
    Number.isInteger(item.likes) &&
    item.likes >= 0 &&
    typeof item.liked === "boolean" &&
    item.likes >= (item.liked ? 1 : 0)
  );
}

function isRecipe(value: unknown): value is StoredRecipe {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.category === "string" &&
    CATEGORIES.includes(item.category) &&
    typeof item.servings === "number" &&
    Number.isInteger(item.servings) &&
    item.servings >= 1 &&
    item.servings <= 30 &&
    typeof item.cookingTime === "number" &&
    Number.isInteger(item.cookingTime) &&
    item.cookingTime >= 1 &&
    item.cookingTime <= 600 &&
    Array.isArray(item.ingredients) &&
    item.ingredients.every((x: unknown) => typeof x === "string") &&
    typeof item.instructions === "string" &&
    typeof item.favorite === "boolean" &&
    (item.imageUrl === undefined || typeof item.imageUrl === "string") &&
    (item.reviews === undefined ||
      (Array.isArray(item.reviews) && item.reviews.every(isReview)))
  );
}
export function loadRecipes(): Recipe[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isRecipe)) {
      return null;
    }
    return parsed.map((recipe) => ({
      ...recipe,
      reviews: recipe.reviews ?? [],
    }));
  } catch {
    return null;
  }
}
export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}
