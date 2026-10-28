export type Category = "Завтрак" | "Обед" | "Ужин" | "Десерт";
export interface Review {
  readonly id: string;
  author: string;
  text: string;
  likes: number;
  liked: boolean;
}
export interface Recipe {
  readonly id: string;
  title: string;
  category: Category;
  servings: number;
  cookingTime: number;
  ingredients: string[];
  instructions: string;
  favorite: boolean;
  reviews: Review[];
  imageUrl?: string;
}
export type RecipeDraft = Omit<Recipe, "id" | "favorite" | "reviews">;
export type RecipeFilter = {
  query: string;
  category: Category | "Все";
  favoritesOnly: boolean;
  under30Only: boolean;
  sortByCookingTime: "none" | "ascending" | "descending";
};
