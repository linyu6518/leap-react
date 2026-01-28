import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { MockDataService } from '@shared/services/mock-data.service';
import * as WorkflowActions from './workflow.actions';

@Injectable()
export class WorkflowEffects {
  // Load workflows effect
  loadWorkflows$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkflowActions.loadWorkflows),
      switchMap(() =>
        this.mockDataService.getWorkflows().pipe(
          map(workflows => WorkflowActions.loadWorkflowsSuccess({ workflows })),
          catchError(error => of(WorkflowActions.loadWorkflowsFailure({ error })))
        )
      )
    )
  );

  // Update workflow status effect
  updateWorkflowStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkflowActions.updateWorkflowStatus),
      switchMap(({ id, status }) =>
        this.mockDataService.updateWorkflowStatus(id, status).pipe(
          map(() => WorkflowActions.updateWorkflowStatusSuccess({ id, status })),
          catchError(error => of(WorkflowActions.updateWorkflowStatusFailure({ error })))
        )
      )
    )
  );

  // Add commentary effect
  addCommentary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkflowActions.addCommentary),
      switchMap(({ workflowId, content }) =>
        this.mockDataService.addCommentary(workflowId, content).pipe(
          map(() => WorkflowActions.addCommentarySuccess({ workflowId, content })),
          catchError(error => of(WorkflowActions.addCommentaryFailure({ error })))
        )
      )
    )
  );

  // Log errors for debugging
  logError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          WorkflowActions.loadWorkflowsFailure,
          WorkflowActions.updateWorkflowStatusFailure,
          WorkflowActions.addCommentaryFailure
        ),
        tap(({ error }) => console.error('Workflow Error:', error))
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private mockDataService: MockDataService
  ) {}
}
