import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { Category, DifficultyType, ApiQuestion, Question, Results, CategoryDetails } from './data.models';
import { switchMap } from 'rxjs/operators';
import { QUESTIONS_QUIZ_AMOUNT, SUB_CATEGORY_SEPARATOR } from './shared/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  private API_URL = "https://opentdb.com/";
  private latestResults!: Results;

  constructor(private http: HttpClient) {
  }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<{ trivia_categories: Category[] }>(this.API_URL + "api_category.php").pipe(
      map(res => res.trivia_categories),
      switchMap(categories => this.extractCategoryDetails(categories))
    );
  }

  // This function takes an array of 'Category' objects and extracts subcategories from the category names.
  // It then groups the subcategories under their corresponding main categories and returns an array of 'CategoryDetails'.
  // This algorithm is completely scalable: in fact if in the future there will be added sub-categories to a category that
  // previously didn't have sub-categories, this code will continue to work well.
  extractCategoryDetails(categories: Category[]): Observable<CategoryDetails[]> {

    const subCategories: Category[] = []; // Array to store extracted subcategories.
    let categoryDetailsArray: CategoryDetails[] = []; // Array to store final 'CategoryDetails'.

    // Iterate through each 'Category' in the input array.
    categories.forEach(category => {
      // Split the category name using the separator to check for subcategories.
      // Actual Separator used to split category names into main category and subcategory is ':', but it can changes.
      // we have no power to the backend data
      const nameParts = category.name.split(SUB_CATEGORY_SEPARATOR);
      
      // if there are 2 parts, the category has a sub-category
      if (nameParts.length > 1) {
        // If the category has a subcategory, extract main category and subcategory names.
        const categoryName = nameParts[0].trim();
        const subCategoryName = nameParts[1].trim();

        // Create a new 'Category' object with the extracted subcategory details.
        // topicName property is used to link to the father category
        const subCategory: Category = { ...category, name: subCategoryName, topicName: categoryName };
        
        // Add the subcategory to the 'subCategories' array.
        subCategories.push(subCategory);
      } else {
        // If there is no subcategory, create a new 'CategoryDetails' object and add it to the 'categoryDetailsArray'.
        const categoryDetails: CategoryDetails = { ...category };
        categoryDetailsArray.push(categoryDetails);
      }
    });

    // Group subcategories under their corresponding main categories.
    let groupedCategories: CategoryDetails[] = subCategories.reduce((result: CategoryDetails[], category: Category) => {
      const existingCategory = result.find((c) => c.name === category.topicName);
    
      if (existingCategory) {
        // If the main category already exists in the 'result', add the subcategory to its 'subCategories' array.
        existingCategory.subCategories?.push(category);
      } else {
        // If the main category doesn't exist in the 'result', create a new entry with the main category and the subcategory.
        result.push({ name: category.topicName ?? '', subCategories: [category] });
      }
    
      return result;
    }, []);

    // Merge the 'categoryDetailsArray' and 'groupedCategories' arrays to get the final result.
    categoryDetailsArray = [...categoryDetailsArray, ...groupedCategories];

    // Return the final 'CategoryDetails' array as an observable using 'of' from RxJS.
    return of(categoryDetailsArray);
  }



  createQuiz(categoryId: string, difficulty: DifficultyType, amount = QUESTIONS_QUIZ_AMOUNT): Observable<Question[]> {
    return this.http.get<{ results: ApiQuestion[] }>(
      `${this.API_URL}/api.php?amount=${amount}&category=${categoryId}&difficulty=${difficulty.toLowerCase()}&type=multiple`)
      .pipe(
        map(res => {
          const quiz: Question[] = res.results.map(q => (
            { ...q, all_answers: [...q.incorrect_answers, q.correct_answer].sort(() => (Math.random() > 0.5) ? 1 : -1) }
          ));
          return quiz;
        })
      );
  }

  computeScore(questions: Question[], answers: string[]): void {
    let score = 0;
    questions.forEach((q, index) => {
      if (q.correct_answer == answers[index])
        score++;
    })
    this.latestResults = { questions, answers, score };
  }

  getLatestResults(): Results {
    return this.latestResults;
  }
}
