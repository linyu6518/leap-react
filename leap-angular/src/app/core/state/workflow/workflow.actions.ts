import { createAction, props } from '@ngrx/store';
import { WorkflowStatus } from '@shared/components/status-badge/status-badge.component';

// Load workflows
export const loadWorkflows = createAction('[Workflow] Load Workflows');
export const loadWorkflowsSuccess = createAction(
  '[Workflow] Load Workflows Success',
  props<{ workflows: any[] }>()
);
export const loadWorkflowsFailure = createAction(
  '[Workflow] Load Workflows Failure',
  props<{ error: any }>()
);

// Update workflow status
export const updateWorkflowStatus = createAction(
  '[Workflow] Update Status',
  props<{ id: number; status: WorkflowStatus }>()
);
export const updateWorkflowStatusSuccess = createAction(
  '[Workflow] Update Status Success',
  props<{ id: number; status: WorkflowStatus }>()
);
export const updateWorkflowStatusFailure = createAction(
  '[Workflow] Update Status Failure',
  props<{ error: any }>()
);

// Add commentary
export const addCommentary = createAction(
  '[Workflow] Add Commentary',
  props<{ workflowId: number; content: string }>()
);
export const addCommentarySuccess = createAction(
  '[Workflow] Add Commentary Success',
  props<{ workflowId: number; content: string }>()
);
export const addCommentaryFailure = createAction(
  '[Workflow] Add Commentary Failure',
  props<{ error: any }>()
);
