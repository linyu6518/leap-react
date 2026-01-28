import { createReducer, on } from '@ngrx/store';
import * as WorkflowActions from './workflow.actions';

export interface WorkflowState {
  workflows: any[];
  loading: boolean;
  error: any;
}

export const initialState: WorkflowState = {
  workflows: [],
  loading: false,
  error: null
};

export const workflowReducer = createReducer(
  initialState,
  on(WorkflowActions.loadWorkflows, state => ({ ...state, loading: true })),
  on(WorkflowActions.loadWorkflowsSuccess, (state, { workflows }) => ({
    ...state,
    workflows,
    loading: false,
    error: null
  })),
  on(WorkflowActions.loadWorkflowsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(WorkflowActions.updateWorkflowStatus, (state, { id, status }) => ({
    ...state,
    workflows: state.workflows.map(w => w.id === id ? { ...w, status } : w)
  }))
);
