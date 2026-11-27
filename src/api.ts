import type { NewRecipe, Recipe } from "./types.js";
import { parseRecipes } from "./parse.js";

const API_URL = "http://localhost:3001/recipes";

async function request<T>(
  url: string,
  init: RequestInit | undefined,
  parser: (data: unknown) => T,
): Promise<T> {
  const response = await fetch(url, init);
  
  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку: ${response.status}`);
  }
  
  const data: unknown = await response.json();
  return parser(data);
}

export async function fetchRecipes(signal?: AbortSignal): Promise<Recipe[]> {
  return request(API_URL, signal ? { signal } : undefined, parseRecipes);
}

export async function createRecipeApi(draft: NewRecipe): Promise<Recipe> {
  return request(
    API_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    },
    (data: unknown) => parseRecipes([data])[0] as Recipe,
  );
}

export async function updateRecipeApi(
  id: string,
  updates: Partial<Recipe>,
): Promise<Recipe> {
  return request(
    `${API_URL}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
    (data: unknown) => parseRecipes([data])[0] as Recipe,
  );
}

export async function deleteRecipeApi(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Сервер вернул ошибку: ${response.status}`);
  }
}
