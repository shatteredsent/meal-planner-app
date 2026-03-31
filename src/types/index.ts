export type Recipe = {
    id: string;
    name: string;
    ingredients: string[];
    steps: string[];
    netCarbs: number;
    prepTime: number;
    cookTime: number;
    servings: number;
    photoUrl?: string;
    fat?: number;
    protein?: number;
    createdBy: string;
    familyId: string;
};

export type MealSlot = {
    recipeId?: string;
    recipeName?: string;
    isCustom?: boolean;
    protein?: string;
    sides?: string[];
    mealType: 'breakfast' | 'lunch' | 'dinner';
    dayOfWeek: string;
};

export type MealPlan = {
    id: string;
    familyId: string;
    weekStartDate: string;
    meals: MealSlot[];
};