import {Component, OnDestroy, OnInit} from '@angular/core';
import {Category, CategoryDetails, DifficultyType, Optional, Question} from '../data.models';
import { Subject, takeUntil} from 'rxjs';
import {QuizService} from '../quiz.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { QUIZ_DIFFICULTIES } from '../shared/constants/constants';

@Component({
  selector: 'app-quiz-maker',
  templateUrl: './quiz-maker.component.html',
  styleUrls: ['./quiz-maker.component.css'],
})
export class QuizMakerComponent implements OnInit, OnDestroy {

  //categories$: Observable<CategoryDetails[]>;
  categories: CategoryDetails[] = [];
  subCategories: Optional<Category[]>;
  questions: Optional<Question[]>;
  selectedCategory : Optional<CategoryDetails>;
  lastSelectedCategory : Optional<CategoryDetails>;
  creationQuizForm!: FormGroup;
  quizDifficulties = QUIZ_DIFFICULTIES;

  enableDynamicQuizCreation = false;


  categorySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null, [Validators.required]);
  subCategorySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null);
  difficultySelect : FormControl<Optional<DifficultyType>> = new FormControl<Optional<DifficultyType>>(null, [Validators.required]);

  protected _onDestroy: Subject<void> = new Subject<void>();
  isLoading: boolean = true;
  isLoadingQuestion: boolean = false;

  constructor(protected quizService: QuizService,
              private fb: FormBuilder
            ) {}

  ngOnInit(){
    this.quizService.getAllCategories().pipe(
      takeUntil(this._onDestroy)
    ).subscribe({
      next: (categories: CategoryDetails[]) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
    this.initForm();

    this.categorySelect.valueChanges.pipe(
      takeUntil(this._onDestroy)
    ).subscribe((value: Optional<String>) => {
      this.selectedCategory = this.categories.find(category => category.name === value);
      this.subCategories = this.selectedCategory?.subCategories;
      if(this.subCategories){
        // add validation to form control subcategories
        this.subCategorySelect.setValidators([Validators.required]);
      }else{
        // remove validation from form control subcategories
        this.subCategorySelect.clearValidators();
      }
      this.subCategorySelect.reset(null);
      this.creationQuizForm.updateValueAndValidity();
    })
  }

  createQuiz(): void {
    const subCategoryChosen = this.subCategorySelect.value;
    const difficulty = this.difficultySelect.value!;
    if(this.selectedCategory && subCategoryChosen){
      const topicName = this.selectedCategory.name;
      this.selectedCategory = this.selectedCategory?.subCategories?.find(subCategory => subCategory.name === subCategoryChosen);
      if(this.selectedCategory){
        this.selectedCategory.topicName = topicName;
      }
    }
    const categoryId = this.selectedCategory?.id?.toString()!;
    this.lastSelectedCategory = this.selectedCategory;
    this.resetForm();
    this.isLoadingQuestion = true;
    this.quizService.createQuiz(categoryId, difficulty).pipe(
      takeUntil(this._onDestroy)
    ).subscribe({
      next: (questions: Question[]) => {
        this.questions = questions;
        this.isLoadingQuestion = false;
      },
      error: (error) => {
        this.isLoadingQuestion = false;
      }
    });
  }

  private initForm() {
    this.creationQuizForm = this.fb.group({
      categorySelect: this.categorySelect,
      subCategorySelect: this.subCategorySelect,
      difficultySelect: this.difficultySelect,
    });
  }

  resetForm(){
    this.creationQuizForm.reset();
  }

  onToggleChange($event: boolean){
    this.enableDynamicQuizCreation = $event;
  }


  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
