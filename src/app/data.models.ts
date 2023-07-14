export type Optional<T> = T | undefined | null;


export interface MinimalCategory {
  name: string;
}

export interface Category extends MinimalCategory {
  id?: number;
  topicName ?: string;
}

export interface CategoryDetails extends Category{
  subCategories?: Category[];
}

export interface ApiQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface Question {
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  all_answers: string[];
}

export interface Results {
  questions: Question[];
  answers: string[];
  score: number;
}


export type Difficulty = "Easy" | "Medium" | "Hard";
