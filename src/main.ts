import type { Category, Recipe, RecipeDraft, RecipeFilter } from "./types.js";
import { initialRecipes } from "./data.js";
import { loadRecipes, saveRecipes } from "./storage.js";
import {
  addReview,
  createRecipe,
  deleteRecipe,
  filterRecipes,
  isValidImageUrl,
  toggleFavorite,
  toggleReviewLike,
  updateRecipe,
} from "./recipes.js";
import {
  searchInput,
  categoryFilter,
  favoritesOnly,
  recipeForm,
  recipeList,
  formMessage,
  renderRecipes,
  recipeFormTitle,
  min30Only,
  cookingTimeSort,
  clearFiltersButton,
  recipeTitleInput,
  recipeCategoryInput,
  recipeServingsInput,
  recipeTimeInput,
  recipeIngredientsInput,
  recipeInstructionsInput,
  recipeImageInput,
  cancelEditButton,
  recipeSubmitButton,
  updateCategoryCounts,
} from "./ui.js";
let recipes: Recipe[] = loadRecipes() ?? initialRecipes;
let editingRecipeId: string | null = null;
function getFilter(): RecipeFilter {
  return {
    query: searchInput.value,
    category: categoryFilter.value as Category | "Все",
    favoritesOnly: favoritesOnly.checked,
    under30Only: min30Only.checked,
    sortByCookingTime:
      cookingTimeSort.value as RecipeFilter["sortByCookingTime"],
  };
}
function render(): void {
  updateCategoryCounts(recipes);
  renderRecipes(filterRecipes(recipes, getFilter()));
}
function persistAndRender(): void {
  saveRecipes(recipes);
  render();
}
searchInput.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
favoritesOnly.addEventListener("change", render);
min30Only.addEventListener("change", render);
cookingTimeSort.addEventListener("change", render);
clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "Все";
  favoritesOnly.checked = false;
  min30Only.checked = false;
  cookingTimeSort.value = "none";
  render();
});

function resetForm(): void {
  recipeForm.reset();
  editingRecipeId = null;
  recipeFormTitle.textContent = "Добавить рецепт";
  recipeSubmitButton.textContent = "Сохранить рецепт";
  cancelEditButton.hidden = true;
}

function editRecipe(id: string): void {
  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) return;
  editingRecipeId = id;
  recipeFormTitle.textContent = "Редактировать рецепт";
  recipeTitleInput.value = recipe.title;
  recipeCategoryInput.value = recipe.category;
  recipeServingsInput.value = String(recipe.servings);
  recipeTimeInput.value = String(recipe.cookingTime);
  recipeIngredientsInput.value = recipe.ingredients.join(", ");
  recipeInstructionsInput.value = recipe.instructions;
  recipeImageInput.value = recipe.imageUrl ?? "";
  recipeSubmitButton.textContent = "Сохранить изменения";
  cancelEditButton.hidden = false;
  formMessage.textContent = `Редактирование рецепта «${recipe.title}».`;
  recipeTitleInput.focus();
}

cancelEditButton.addEventListener("click", () => {
  resetForm();
  formMessage.textContent = "Редактирование отменено.";
});
recipeList.addEventListener("click", (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  if (!id) return;
  if (action === "favorite") {
    recipes = toggleFavorite(recipes, id);
  } else if (action === "like-review") {
    const reviewId = button.dataset.reviewId;
    if (!reviewId) return;
    recipes = toggleReviewLike(recipes, id, reviewId);
  } else if (action === "delete") {
    if (!window.confirm("Удалить этот рецепт?")) return;
    recipes = deleteRecipe(recipes, id);
    if (editingRecipeId === id) {
      resetForm();
      formMessage.textContent = "Рецепт удален.";
    }
  } else if (action === "edit") {
    editRecipe(id);
    return;
  } else {
    return;
  }
  persistAndRender();
});
recipeList.addEventListener("submit", (event: SubmitEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLFormElement) || !target.dataset.recipeId) return;
  event.preventDefault();
  const formData = new FormData(target);
  const author = formData.get("author");
  const text = formData.get("text");
  const message = target.querySelector<HTMLParagraphElement>(".review-message");
  if (!message) return;
  if (
    typeof author !== "string" ||
    typeof text !== "string" ||
    !author.trim() ||
    !text.trim()
  ) {
    message.textContent = "Укажите имя и текст отзыва.";
    return;
  }
  recipes = addReview(
    recipes,
    target.dataset.recipeId,
    author.trim(),
    text.trim(),
  );
  persistAndRender();
});
recipeForm.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();
  const title = recipeTitleInput.value.trim();
  const servings = Number(recipeServingsInput.value);
  const cookingTime = Number(recipeTimeInput.value);
  const ingredients = recipeIngredientsInput.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const instructions = recipeInstructionsInput.value.trim();
  const imageUrl = recipeImageInput.value.trim();
  if (!title || !instructions || ingredients.length === 0) {
    formMessage.textContent = "Заполните все поля формы.";
    return;
  }
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    formMessage.textContent =
      "Укажите корректную ссылку на изображение (HTTP или HTTPS).";
    return;
  }
  if (!Number.isInteger(servings) || servings < 1 || servings > 30) {
    formMessage.textContent = "Количество порций должно быть от 1 до 30.";
    return;
  }
  if (!Number.isInteger(cookingTime) || cookingTime < 1 || cookingTime > 600) {
    formMessage.textContent = "Время должно быть от 1 до 600 минут.";
    return;
  }
  const draft: RecipeDraft = {
    title,
    category: recipeCategoryInput.value as Category,
    servings,
    cookingTime,
    ingredients,
    instructions,
    imageUrl,
  };
  if (editingRecipeId) {
    recipes = updateRecipe(recipes, editingRecipeId, draft);
    formMessage.textContent = "Изменения сохранены.";
  } else {
    recipes = [createRecipe(draft), ...recipes];
    formMessage.textContent = "Рецепт добавлен.";
  }
  resetForm();
  persistAndRender();
});
render();
