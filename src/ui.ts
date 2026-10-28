import type { Recipe, Review } from "./types.js";
import { isValidImageUrl } from "./recipes.js";

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Не найден элемент: ${selector}`);
  }
  return element;
}
export const searchInput = requireElement<HTMLInputElement>("#search");
export const categoryFilter =
  requireElement<HTMLSelectElement>("#category-filter");
export const favoritesOnly =
  requireElement<HTMLInputElement>("#favorites-only");
export const recipeForm = requireElement<HTMLFormElement>("#recipe-form");
export const recipeSubmitButton =
  requireElement<HTMLButtonElement>("#recipe-submit");
export const recipeFormTitle = requireElement<HTMLHeadingElement>("#add-title");
export const recipeList = requireElement<HTMLDivElement>("#recipe-list");
export const formMessage =
  requireElement<HTMLParagraphElement>("#form-message");
export const resultsCount =
  requireElement<HTMLParagraphElement>("#results-count");
export const min30Only = requireElement<HTMLInputElement>('[id="30min-only"]');
export const cookingTimeSort =
  requireElement<HTMLSelectElement>("#cooking-time-sort");
export const clearFiltersButton =
  requireElement<HTMLButtonElement>("#clear-filters");
export const recipeTitleInput =
  requireElement<HTMLInputElement>("#recipe-title");
export const recipeCategoryInput =
  requireElement<HTMLSelectElement>("#recipe-category");
export const recipeServingsInput =
  requireElement<HTMLInputElement>("#recipe-servings");
export const recipeTimeInput = requireElement<HTMLInputElement>("#recipe-time");
export const recipeIngredientsInput = requireElement<HTMLTextAreaElement>(
  "#recipe-ingredients",
);
export const recipeInstructionsInput = requireElement<HTMLTextAreaElement>(
  "#recipe-instructions",
);
export const recipeImageInput =
  requireElement<HTMLInputElement>("#recipe-image-url");
export const cancelEditButton =
  requireElement<HTMLButtonElement>("#cancel-edit");

const categoryFilterOptions = Array.from(categoryFilter.options);

export function updateCategoryCounts(recipes: Recipe[]): void {
  const counts = new Map<string, number>();
  for (const recipe of recipes) {
    counts.set(recipe.category, (counts.get(recipe.category) ?? 0) + 1);
  }
  for (const option of categoryFilterOptions) {
    const count =
      option.value === "Все" ? recipes.length : (counts.get(option.value) ?? 0);
    const label = option.value === "Все" ? "Все категории" : option.value;
    option.textContent = `${label} (${count})`;
  }
}

function reviewCountLabel(count: number): string {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  const noun =
    lastTwoDigits >= 11 && lastTwoDigits <= 14
      ? "отзывов"
      : lastDigit === 1
        ? "отзыв"
        : lastDigit >= 2 && lastDigit <= 4
          ? "отзыва"
          : "отзывов";
  return `${count} ${noun}`;
}

function renderReview(review: Review, recipeId: string): HTMLElement {
  const item = document.createElement("article");
  item.className = "review-item";
  const author = document.createElement("h4");
  author.textContent = review.author;
  const text = document.createElement("p");
  text.textContent = review.text;
  const likeButton = document.createElement("button");
  likeButton.type = "button";
  likeButton.dataset.action = "like-review";
  likeButton.dataset.id = recipeId;
  likeButton.dataset.reviewId = review.id;
  likeButton.setAttribute("aria-pressed", String(review.liked));
  likeButton.textContent = `${review.liked ? "♥" : "♡"} Нравится (${review.likes})`;
  item.append(author, text, likeButton);
  return item;
}

export function renderRecipes(recipes: Recipe[]): void {
  recipeList.replaceChildren();
  resultsCount.textContent = `Найдено рецептов: ${recipes.length}`;
  if (recipes.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Ничего не найдено. Измените фильтр.";
    recipeList.append(empty);
    return;
  }
  for (const recipe of recipes) {
    const card = document.createElement("article");
    card.className = "recipe-card";
    const title = document.createElement("h3");
    title.textContent = recipe.title;
    const meta = document.createElement("p");
    meta.textContent = `${recipe.category} · ${recipe.cookingTime} мин. · ${recipe.servings} порц.`;
    const ingredients = document.createElement("p");
    ingredients.textContent = `Ингредиенты: ${recipe.ingredients.join(", ")}`;
    const instructions = document.createElement("p");
    instructions.textContent = recipe.instructions;
    const reviewsHeading = document.createElement("h4");
    reviewsHeading.textContent = `Отзывы: ${reviewCountLabel(recipe.reviews.length)}`;
    const reviews = document.createElement("div");
    reviews.className = "recipe-reviews";
    if (recipe.reviews.length === 0) {
      const emptyReviews = document.createElement("p");
      emptyReviews.className = "empty-reviews";
      emptyReviews.textContent = "Пока нет отзывов.";
      reviews.append(emptyReviews);
    } else {
      for (const review of recipe.reviews) {
        reviews.append(renderReview(review, recipe.id));
      }
    }
    const reviewForm = document.createElement("form");
    reviewForm.className = "review-form";
    reviewForm.dataset.recipeId = recipe.id;
    const authorLabel = document.createElement("label");
    authorLabel.textContent = "Ваше имя";
    const authorInput = document.createElement("input");
    authorInput.name = "author";
    authorInput.required = true;
    authorInput.maxLength = 40;
    authorInput.autocomplete = "name";
    authorLabel.append(authorInput);
    const reviewLabel = document.createElement("label");
    reviewLabel.textContent = "Отзыв";
    const reviewInput = document.createElement("textarea");
    reviewInput.name = "text";
    reviewInput.required = true;
    reviewInput.maxLength = 500;
    reviewLabel.append(reviewInput);
    const reviewSubmit = document.createElement("button");
    reviewSubmit.type = "submit";
    reviewSubmit.textContent = "Добавить отзыв";
    const reviewMessage = document.createElement("p");
    reviewMessage.className = "review-message";
    reviewMessage.setAttribute("role", "status");
    reviewForm.append(authorLabel, reviewLabel, reviewSubmit, reviewMessage);
    if (recipe.imageUrl && isValidImageUrl(recipe.imageUrl)) {
      const image = document.createElement("img");
      image.src = recipe.imageUrl;
      image.alt = recipe.title;
      image.loading = "lazy";
      image.className = "recipe-image";
      card.append(image);
    }
    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.dataset.action = "favorite";
    favoriteButton.dataset.id = recipe.id;
    favoriteButton.textContent = recipe.favorite
      ? "★ Убрать из избранного"
      : "☆ В избранное";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = recipe.id;
    deleteButton.textContent = "Удалить";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = recipe.id;
    editButton.textContent = "Редактировать";
    card.append(
      title,
      meta,
      ingredients,
      instructions,
      reviewsHeading,
      reviews,
      reviewForm,
      favoriteButton,
      editButton,
      deleteButton,
    );
    recipeList.append(card);
  }
}
