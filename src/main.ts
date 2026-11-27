import type { LoadState } from "./state.js";
import { assertNever, errorMessage } from "./state.js";
import {
  createRecipeApi,
  deleteRecipeApi,
  fetchRecipes,
  updateRecipeApi,
  updateRecipeOnServer,
} from "./api.js";
import { debounce } from "./debounce.js";
import { retry } from "./retry.js";
import type {
  Category,
  NewRecipe,
  Recipe,
  RecipeDraft,
  RecipeFilter,
  RecipeSortKey,
  RecipeUpdate,
} from "./types.js";
import {
  addReview,
  deleteRecipe,
  filterRecipes,
  isValidImageUrl,
  toggleReviewLike,
  sortRecipes,
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
  renderMessage,
  retryLoadButton,
  editRecipeForm,
  editRecipeId,
  editRecipeTitle,
  editRecipeCategory,
  editRecipeServings,
  editRecipeTime,
  editRecipeIngredients,
  editRecipeInstructions,
  editMessage,
  sortKeySelect,
  sortDirectionSelect,
} from "./ui.js";
let recipes: Recipe[] = [];
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
function persistAndRender(): void {
  render();
}
const debouncedRender = debounce(() => render(), 250);
searchInput.addEventListener("input", debouncedRender);
categoryFilter.addEventListener("change", render);
favoritesOnly.addEventListener("change", render);
min30Only.addEventListener("change", render);
cookingTimeSort.addEventListener("change", render);
sortKeySelect.addEventListener("change", render);
sortDirectionSelect.addEventListener("change", render);
clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "Все";
  favoritesOnly.checked = false;
  min30Only.checked = false;
  cookingTimeSort.value = "none";
  sortKeySelect.value = "title";
  sortDirectionSelect.value = "asc";
  render();
});

function resetForm(): void {
  recipeForm.reset();
  editingRecipeId = null;
  recipeFormTitle.textContent = "Добавить рецепт";
  recipeSubmitButton.textContent = "Сохранить рецепт";
}

function editRecipe(id: string): void {
  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) return;
  editRecipeId.value = recipe.id;
  editRecipeTitle.value = recipe.title;
  editRecipeCategory.value = recipe.category;
  editRecipeServings.value = String(recipe.servings);
  editRecipeTime.value = String(recipe.cookingTime);
  editRecipeIngredients.value = recipe.ingredients.join(", ");
  editRecipeInstructions.value = recipe.instructions;
  editMessage.textContent = `Редактирование рецепта «${recipe.title}».`;
  editRecipeForm.hidden = false;
  editRecipeForm.scrollIntoView({ behavior: "smooth", block: "center" });
  editRecipeTitle.focus();
}

cancelEditButton.addEventListener("click", () => {
  editRecipeForm.reset();
  editRecipeForm.hidden = true;
  editMessage.textContent = "Редактирование отменено.";
});
recipeList.addEventListener("click", async (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  if (!id) return;
  try {
    if (action === "favorite") {
      const recipe = recipes.find((item) => item.id === id);
      if (!recipe) return;
      const updated = await updateRecipeApi(id, { favorite: !recipe.favorite });
      recipes = recipes.map((item) => (item.id === id ? updated : item));
    } else if (action === "like-review") {
      const reviewId = button.dataset.reviewId;
      if (!reviewId) return;
      const next = toggleReviewLike(recipes, id, reviewId);
      const recipe = next.find((item) => item.id === id);
      if (!recipe) return;
      await updateRecipeApi(id, { reviews: recipe.reviews });
      recipes = next;
    } else if (action === "delete") {
      if (!window.confirm("Удалить этот рецепт?")) return;
      await deleteRecipeApi(id);
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
  } catch (error) {
    formMessage.textContent = `Не удалось сохранить изменение: ${errorMessage(error)}`;
  }
});

editRecipeForm.addEventListener("submit", async (event: SubmitEvent) => {
  event.preventDefault();
  if (state.status !== "success") return;

  const category = editRecipeCategory.value;
  if (
    category !== "Завтрак" &&
    category !== "Обед" &&
    category !== "Ужин" &&
    category !== "Десерт"
  ) return;

  const id = editRecipeId.value;
  const changes: RecipeUpdate = {
    title: editRecipeTitle.value.trim(),
    category,
    servings: Number(editRecipeServings.value),
    cookingTime: Number(editRecipeTime.value),
    ingredients: editRecipeIngredients.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    instructions: editRecipeInstructions.value.trim(),
  };

  try {
    const updated = await updateRecipeOnServer(id, changes);
    recipes = recipes.map((recipe) =>
      recipe.id === id ? updated : recipe,
    );
    editRecipeForm.reset();
    editRecipeForm.hidden = true;
    editMessage.textContent = "Изменения сохранены.";
    persistAndRender();
  } catch (error) {
    editMessage.textContent = `Не удалось сохранить изменения: ${errorMessage(error)}`;
  }
});

recipeList.addEventListener("submit", async (event: SubmitEvent) => {
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
  const next = addReview(
    recipes,
    target.dataset.recipeId,
    author.trim(),
    text.trim(),
  );
  const recipe = next.find((item) => item.id === target.dataset.recipeId);
  if (!recipe) return;
  try {
    await updateRecipeApi(recipe.id, { reviews: recipe.reviews });
  } catch (error) {
    message.textContent = `Не удалось добавить отзыв: ${errorMessage(error)}`;
    return;
  }
  recipes = next;
  message.textContent = "Отзыв добавлен.";
  persistAndRender();
});
recipeForm.addEventListener("submit", async (event: SubmitEvent) => {
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
  try {
    if (editingRecipeId) {
      const updated = await updateRecipeApi(editingRecipeId, draft);
      recipes = recipes.map((recipe) =>
        recipe.id === editingRecipeId ? updated : recipe,
      );
      formMessage.textContent = "Изменения сохранены.";
    } else {
      const newRecipe: NewRecipe = {
        ...draft,
        favorite: false,
        reviews: [],
      };
      const created = await createRecipeApi(newRecipe);
      recipes = [created, ...recipes];
      formMessage.textContent = "Рецепт добавлен.";
    }
  } catch (error) {
    formMessage.textContent =
      `Не удалось сохранить рецепт: ${errorMessage(error)}`;
    return;
  }
  resetForm();
  persistAndRender();
});

let state: LoadState = { status: "loading" };
const minimumLoadingDurationMs = 3000;

async function waitForMinimumLoadingDuration(startedAt: number): Promise<void> {
  const remaining = minimumLoadingDurationMs - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  }
}

function setState(next: LoadState): void {
  state = next;
  if (next.status === "success") {
    recipes = next.recipes;
  }
  render();
}

function render(): void {
  switch (state.status) {
    case "loading":
      renderMessage("Загрузка рецептов...");
      break;
    
    case "error":
      renderMessage(`Не удалось загрузить рецепты: ${state.message}`);
      retryLoadButton.hidden = false;
      break;
    
    case "success": {
      retryLoadButton.hidden = true;
      updateCategoryCounts(recipes);
      const filtered = filterRecipes(recipes, getFilter());
      const sorted = sortRecipes(
        filtered,
        sortKeySelect.value as RecipeSortKey,
        sortDirectionSelect.value as "asc" | "desc",
      );
      renderRecipes(sorted);
      break;
    }
    
    default:
      assertNever(state);
  }
}

async function init(): Promise<void> {
  const loadingStartedAt = Date.now();
  setState({ status: "loading" });
  try {
    const recipes = await retry(() => fetchRecipes(), 3, 500);
    await waitForMinimumLoadingDuration(loadingStartedAt);
    setState({ status: "success", recipes });
  } catch (error) {
    setState({ status: "error", message: errorMessage(error) });
  }
}

retryLoadButton.addEventListener("click", () => {
  void init();
});

void init();
