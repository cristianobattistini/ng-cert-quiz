import {Component} from '@angular/core';
import {Category, CategoryDetails, Difficulty, Optional, Question} from '../data.models';
import {Observable} from 'rxjs';
import {QuizService} from '../quiz.service';

@Component({
  selector: 'app-quiz-maker',
  templateUrl: './quiz-maker.component.html',
  styleUrls: ['./quiz-maker.component.css']
})
export class QuizMakerComponent {

  categories$: Observable<CategoryDetails[]>;
  questions$!: Observable<Question[]>;
  selectedCategory : Optional<CategoryDetails>;

  constructor(protected quizService: QuizService) {
    this.categories$ = quizService.getAllCategories();
  }

  createQuiz(cat: string, difficulty: string): void {
    this.questions$ = this.quizService.createQuiz(cat, difficulty as Difficulty);
  }

  //switch che controlla il nome

  onCategoryChange(category: CategoryDetails): void {
    console.log(category)
    console.log(this.selectedCategory)
  }
  
  /*categories$: Observable<Category[]>;
  questions$!: Observable<Question[]>;

  constructor(protected quizService: QuizService) {
    this.categories$ = quizService.getAllCategories()
  }

  createQuiz(cat: string, difficulty: string): void {
    console.log(cat)
    this.questions$ = this.quizService.createQuiz(cat, difficulty as Difficulty);
  }*/
  
}
