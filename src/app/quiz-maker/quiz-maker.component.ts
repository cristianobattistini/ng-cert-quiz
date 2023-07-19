import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
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

  categories: CategoryDetails[] = [];
  subCategories: Optional<Category[]>;
  questions: Optional<Question[]>;
  selectedCategory : Optional<CategoryDetails>;

  // it keeps the value of the last category chosen as a cache variable
  lastSelectedCategory : Optional<CategoryDetails>;
  // it keeps the value of the last difficulty chosen as a cache variable
  lastSelectedDifficulty: Optional<DifficultyType>;

  creationQuizForm!: FormGroup;
  quizDifficulties = QUIZ_DIFFICULTIES;

  enableDynamicQuizCreation = false;


  categorySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null, [Validators.required]);
  subCategorySelect : FormControl<Optional<String>> = new FormControl<Optional<String>>(null);
  difficultySelect : FormControl<Optional<DifficultyType>> = new FormControl<Optional<DifficultyType>>(null, [Validators.required]);

  protected _onDestroy: Subject<void> = new Subject<void>();
  isLoading: boolean = true;
  isLoadingQuestion: boolean = false;
  subCategoryChosen: Optional<String>;

  constructor(protected quizService: QuizService,
              private fb: FormBuilder,
              private cdRef: ChangeDetectorRef
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
        // add validation to form control subcategories because at least one sub-category must be chosen
        // if it was previously chosen one category that contains subcategories
        this.subCategorySelect.setValidators([Validators.required]);
      }else{
        // remove validation from form control subcategories
        // because the chosen category does not contain sub-categories
        this.subCategorySelect.clearValidators();
      }
      this.subCategorySelect.reset(null);
      this.creationQuizForm.updateValueAndValidity();
    })
  }

  /**
   * this method is valid for two different ways of choosing the quiz:
   * static via static seletcs 
   * or
   * dynamic via dynamic filters
   */
  createQuiz(): void {
    //the variable subCategoryChosen contains the value chosen
    // in the dynamic way this value is digited by the user
    // in the static way this value is selected via static dropdown
    if(!this.subCategoryChosen){
      this.subCategoryChosen = this.subCategorySelect.value;
    }
    const difficulty = this.difficultySelect.value!;
    // if a subCategory was chosen, the selected category must be changed
    // because initially it keeps the value of the father category
    if(this.selectedCategory && this.subCategoryChosen){
      const topicName = this.selectedCategory.name;
      this.selectedCategory = this.selectedCategory?.subCategories?.find(subCategory => subCategory.name.toLowerCase() === this.subCategoryChosen?.toLowerCase());
      if(this.selectedCategory){
        this.selectedCategory.topicName = topicName;
      }
    }
    const categoryId = this.selectedCategory?.id?.toString()!;
    this.lastSelectedCategory = this.selectedCategory;
    this.lastSelectedDifficulty = this.difficultySelect.value;
    //after the click and the computation the form is reset
    this.resetForm();
    this.isLoadingQuestion = true;
    this.subCategoryChosen = null;
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

  /**
   * it gives us the possibility to use static or dynamic way to create quiz
   */
  onToggleChange($event: boolean){
    this.resetForm();
    this.enableDynamicQuizCreation = $event;
    if(this.enableDynamicQuizCreation){
      this.categorySelect.setValidators(null);
      this.subCategorySelect.setValidators(null);
    }else{
      this.categorySelect.setValidators(Validators.required);
    }
  }

  /**
   * if the string is equal to the name of one correct category, it will be the selected category
   * @param $event contains the string of the category digited inside the filter input 
   */
  onCategoryInputChange($event: string){
    if($event){
      this.selectedCategory = this.categories.find(category => category.name.toLowerCase() === $event.toLowerCase());
      this.subCategories = this.selectedCategory?.subCategories;
    }
    this.creationQuizForm.updateValueAndValidity();
    this.cdRef.detectChanges();
  }

  /**
   * the value is saved in the subCategoryChosen variable
   * @param $event string that contains the value of the digited sub category
   */
  onSubCategoryInputChange($event: string){
    if($event){
      this.subCategoryChosen = $event
    }else{
      this.subCategoryChosen = null;
    }
  }



  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }
}
