import {Component, OnDestroy, OnInit} from '@angular/core';
import {Category, CategoryDetails, Difficulty, Optional, Question} from '../data.models';
import {Observable, Subject, takeUntil} from 'rxjs';
import {QuizService} from '../quiz.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-quiz-maker',
  templateUrl: './quiz-maker.component.html',
  styleUrls: ['./quiz-maker.component.css']
})
export class QuizMakerComponent implements OnInit, OnDestroy {

  //categories$: Observable<CategoryDetails[]>;
  categories: CategoryDetails[] = [];
  subCategories: Optional<Category[]>;
  questions$!: Observable<Question[]>;
  selectedCategory : Optional<CategoryDetails>;
  creationQuizForm!: FormGroup;

  categorySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null, [Validators.required]);
  subCategorySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null);
  difficultySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null, [Validators.required]);

  protected _onDestroy: Subject<void> = new Subject<void>();
  isLoading = true;

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
        console.log(error);
        this.isLoading = false;
      }
    });
    this.initForm();

    this.categorySelect.valueChanges.subscribe((value: Optional<String>) => {
      this.selectedCategory = this.categories.find(category => category.name === value)
      this.subCategories = this.selectedCategory?.subCategories;
      if(this.subCategories){
        // add validation to form control subcategories
      }else{
        // remove validation from form control subcategories
      }
      this.subCategorySelect.reset(null);
    })
  }

  createQuiz(cat: string, difficulty: string): void {
    this.questions$ = this.quizService.createQuiz(cat, difficulty as Difficulty);
  }

  onCategoryChange(category: CategoryDetails): void {
    console.log(category)
    console.log(this.selectedCategory)
  }
  

  private initForm() {
    this.creationQuizForm = this.fb.group({
      categorySelect: this.categorySelect,
      subCategorySelect: this.subCategorySelect,
      difficultySelect: this.difficultySelect,
    });
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
  
  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
