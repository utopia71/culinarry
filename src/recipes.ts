import type {
  CategoryLabels,
  Recipe,
  RecipeDraft,
  RecipeFilter,
  RecipeSortKey,
  Review,
} from "./types.js";

export const CATEGORY_LABELS = {
  "Завтрак": "Утренние блюда",
  "Обед": "Основные блюда",
  "Ужин": "Вечерние блюда",
  "Десерт": "Сладкие блюда",
} satisfies CategoryLabels;
export function filterRecipes(
  recipes: Recipe[],
  filter: RecipeFilter,
): Recipe[] {
  const query = filter.query.trim().toLowerCase();
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesQuery = recipe.title.toLowerCase().includes(query);
    const matchesCategory =
      filter.category === "Все" || recipe.category === filter.category;
    const matchesFavorite = !filter.favoritesOnly || recipe.favorite;
    const matchesCookingTime = !filter.under30Only || recipe.cookingTime <= 30;
    return (
      matchesQuery && matchesCategory && matchesFavorite && matchesCookingTime
    );
  });
  if (filter.sortByCookingTime === "ascending") {
    filteredRecipes.sort((a, b) => a.cookingTime - b.cookingTime);
  } else if (filter.sortByCookingTime === "descending") {
    filteredRecipes.sort((a, b) => b.cookingTime - a.cookingTime);
  }
  return filteredRecipes;
}

export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
export function createRecipe(draft: RecipeDraft): Recipe {
  return {
    ...draft,
    id: crypto.randomUUID(),
    favorite: false,
    reviews: [],
  };
}

export function addReview(
  recipes: Recipe[],
  recipeId: string,
  author: string,
  text: string,
): Recipe[] {
  const review: Review = {
    id: crypto.randomUUID(),
    author,
    text,
    likes: 0,
    liked: false,
  };
  return recipes.map((recipe) =>
    recipe.id === recipeId
      ? { ...recipe, reviews: [...recipe.reviews, review] }
      : recipe,
  );
}

export function toggleReviewLike(
  recipes: Recipe[],
  recipeId: string,
  reviewId: string,
): Recipe[] {
  return recipes.map((recipe) =>
    recipe.id === recipeId
      ? {
          ...recipe,
          reviews: recipe.reviews.map((review) => {
            if (review.id !== reviewId) return review;
            const liked = !review.liked;
            return { ...review, liked, likes: review.likes + (liked ? 1 : -1) };
          }),
        }
      : recipe,
  );
}
export function toggleFavorite(recipes: Recipe[], id: string): Recipe[] {
  return recipes.map((recipe) =>
    recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe,
  );
}
export function deleteRecipe(recipes: Recipe[], id: string): Recipe[] {
  return recipes.filter((recipe) => recipe.id !== id);
}

export function updateRecipe(
  recipes: Recipe[],
  id: string,
  updates: Partial<RecipeDraft>,
): Recipe[] {
  return recipes.map((recipe) =>
    recipe.id === id ? { ...recipe, ...updates } : recipe,
  );
}

export function sortRecipes(
  recipes: Recipe[],
  key: RecipeSortKey,
  direction: "asc" | "desc",
): Recipe[] {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...recipes].sort((a, b) => {
    const left = a[key];
    const right = b[key];

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * multiplier;
    }

    return String(left).localeCompare(String(right), "ru") * multiplier;
  });
}
