import {Component, inject, Input} from '@angular/core';
import {CategoryDetails, DifficultyType, Optional, Question} from '../data.models';
import {QuizService} from '../quiz.service';
import {Router} from '@angular/router';
import { switchMap, take } from 'rxjs';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent {

  @Input()
  selectedCategory: Optional<CategoryDetails>;

  @Input()
  selectedDifficulty: Optional<DifficultyType>;

  @Input()
  questions: Question[] | null = [];

  disableChangeQuestions : boolean = false;
  changedQuestion ?: {question: Question, position: number};

  userAnswers: string[] = [];
  quizService = inject(QuizService);
  router = inject(Router);

  onChangeQuestion($event: number){
    this.disableChangeQuestions = true;
    if(this.selectedCategory && this.selectedCategory.id && this.selectedDifficulty){
      this.quizService.createQuiz(this.selectedCategory.id.toString(), this.selectedDifficulty, 1).pipe(
        take(1),
      )
      .subscribe((questions: Question[]) => {
        if(questions[0])
          this.changedQuestion = { question: questions[0], position: $event };
      });
    }
  }

  submit(): void {
    this.quizService.computeScore(this.questions ?? [], this.userAnswers);
    this.router.navigateByUrl("/result");
  }

}
