import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AnswerChosen, Question, QuestionDetails} from '../data.models';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})
export class QuestionComponent implements OnChanges {


  @Input({required: true})
  question!: Question;
  @Input()
  correctAnswer?: string;
  @Input()
  userAnswer?: string;

  /**
   * every question has its own index inside the array of question
   */
  @Input()
  questionIndex!: number;
  @Input()
  hideChangeQuestionsButton?: boolean;
  @Input()
  newChangedQuestion?: QuestionDetails;

  /**
   * the answer is wrapped with the position of the question inside the array
   */
  @Output()
  change = new EventEmitter<AnswerChosen>();
  
  @Output()
  changeQuestion = new EventEmitter<number>();

  currentSelection!: string;

  loadingChangeQuestion = false;

  ngOnChanges(changes: SimpleChanges): void {
    // this is to change the value of a question changed with the new one
    if(changes['newChangedQuestion']?.currentValue){
        this.changeQuestionToDisplay(changes['newChangedQuestion']?.currentValue)
    }
  }

  getButtonClass(answer: string): string {
    if (! this.userAnswer) {
        if (this.currentSelection == answer)
          return "tertiary";
    } else {
      if (this.userAnswer == this.correctAnswer && this.userAnswer == answer)
        return "tertiary";
      if (answer == this.correctAnswer)
        return "secondary";
    }
    return "primary";
  }

  buttonClicked(answer: string): void {
    this.currentSelection = answer;
    this.change.emit({answer, position: this.questionIndex});
  }

  changeQuestionButtonClicked(): void {
    this.changeQuestion.emit(this.questionIndex);
    this.loadingChangeQuestion = true;
  }

  changeQuestionToDisplay(newQuestion: QuestionDetails) {
    if(this.questionIndex === newQuestion.position){
      this.question = newQuestion.question;
      this.loadingChangeQuestion = false
    }
  }
}
