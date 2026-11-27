import type { Recipe, Review } from "./types.js";

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
    typeof item.liked === "boolean"
  );
}

function isRecipe(value: unknown): value is StoredRecipe {
  if (typeof value !== "object" || value === null) return false;
  
  const item = value as Record<string, unknown>;
  
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    (item.category === "Завтрак" ||
      item.category === "Обед" ||
      item.category === "Ужин" ||
      item.category === "Десерт") &&
    typeof item.servings === "number" &&
    typeof item.cookingTime === "number" &&
    Array.isArray(item.ingredients) &&
    item.ingredients.every(x => typeof x === "string") &&
    typeof item.instructions === "string" &&
    typeof item.favorite === "boolean" &&
    (item.imageUrl === undefined || typeof item.imageUrl === "string") &&
    (item.reviews === undefined ||
      (Array.isArray(item.reviews) && item.reviews.every(isReview)))
  );
}

export function parseRecipes(data: unknown): Recipe[] {
  if (!Array.isArray(data) || !data.every(isRecipe)) {
    throw new Error("Сервер вернул данные неожиданного формата");
  }
  return data.map((recipe) => ({
    ...recipe,
    reviews: recipe.reviews ?? [],
  }));
}

export function parseRecipe(data: unknown): Recipe {
  const recipes = parseRecipes([data]);
  if (!recipes[0]) {
    throw new Error("Сервер вернул пустой ответ");
  }
  return recipes[0];
}
