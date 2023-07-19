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

  extractCategoryDetails(categories: Category[]){
    const subCategories: Category[] = [];
    let categoryDetailsArray: CategoryDetails[] = [];
    categories.forEach(category => {
      const nameParts = category.name.split(SUB_CATEGORY_SEPARATOR);
      if (nameParts.length > 1) {
        const categoryName = nameParts[0].trim();
        const subCategoryName = nameParts[1].trim();
        const subCategory : Category = {...category, name: subCategoryName, topicName: categoryName}
        subCategories.push(subCategory);
      }else{
        const categoryDetails : CategoryDetails = {...category};
        categoryDetailsArray.push(categoryDetails);
      }
    });
    let groupedCategories: CategoryDetails[] = subCategories.reduce((result: CategoryDetails[], category: Category) => {
      const existingCategory = result.find((c) => c.name === category.topicName);
    
      if (existingCategory) {
        existingCategory.subCategories?.push(category);
      } else {
        result.push({name: category.topicName ?? '', subCategories: [category] });
      }
    
      return result;
    }, []);
    categoryDetailsArray = [...categoryDetailsArray, ...groupedCategories];
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
