import {Component, inject, Input, OnInit} from '@angular/core';
import {AnswerChosen, CategoryDetails, DifficultyType, Optional, Question, QuestionDetails} from '../data.models';
import {QuizService} from '../quiz.service';
import {Router} from '@angular/router';
import { take } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { QUESTION_FORM_CONTROL_INCIPIT, QUESTIONS_QUIZ_AMOUNT } from '../shared/constants/constants';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit{

  @Input()
  selectedCategory: Optional<CategoryDetails>;

  @Input()
  selectedDifficulty: Optional<DifficultyType>;

  @Input()
  questions: Question[] | null = [];

  disableChangeQuestions : boolean = false;
  changedQuestion ?: QuestionDetails;

  userAnswers: string[] = [];

  quizService = inject(QuizService);
  router = inject(Router);

  QUESTIONS_AMOUNT = QUESTIONS_QUIZ_AMOUNT;
  FORM_CONTROL_INCIPIT= QUESTION_FORM_CONTROL_INCIPIT;
  quizForm!: FormGroup;
  isLoadingChangeQuestion: boolean = false;

  constructor(private fb: FormBuilder){}

  ngOnInit(){
    this.setUpQuizForm();
  }

  setUpQuizForm() {
    this.quizForm = this.fb.group({ })
    for (let i = 0; i < +this.QUESTIONS_AMOUNT; i++) {
      const questionControlName = this.FORM_CONTROL_INCIPIT + i;
      this.quizForm.addControl(questionControlName, new FormControl<string>("", Validators.required));
    }
    this.quizForm.updateValueAndValidity();
  }

  onChangeQuestion($event: number){
    this.isLoadingChangeQuestion = true;
    this.disableChangeQuestions = true;
    if(this.selectedCategory && this.selectedCategory.id && this.selectedDifficulty){
      this.quizService.createQuiz(this.selectedCategory.id.toString(), this.selectedDifficulty, "1").pipe(
        take(1),
      )
      .subscribe({
        next: (questions: Question[]) => {
          if(questions[0])
          this.changedQuestion = { question: questions[0], position: $event };
          if(this.changedQuestion && this.questions){
            this.questions?.splice(this.changedQuestion.position, 1, this.changedQuestion.question);
            const formControl = this.quizForm.get(this.FORM_CONTROL_INCIPIT + this.changedQuestion.position);
            if(formControl){
              formControl.setValue("");
            }
            this.isLoadingChangeQuestion = false;
          }
        },
        error: () => {
          this.disableChangeQuestions = false;
          this.isLoadingChangeQuestion = false;
        }
      });
    }
  }

  onUserAnswer($event: AnswerChosen){
    const formControl = this.quizForm.get(this.FORM_CONTROL_INCIPIT + $event.position);
    if(formControl){
      formControl.setValue($event.answer);
    }
  }

  submit(): void {
    if(this.quizForm.value){
      const keys = Object.keys(this.quizForm.value);
      this.userAnswers = keys.map(key => this.quizForm.value[key]);    
      this.quizService.computeScore(this.questions ?? [], this.userAnswers);
      this.router.navigateByUrl("/result");    
    }
  }

}

