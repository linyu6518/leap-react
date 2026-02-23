import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WorkflowState } from './workflow.reducer';
import { WorkflowStatus } from '@shared/components/status-badge/status-badge.component';

// Feature selector
export const selectWorkflowState = createFeatureSelector<WorkflowState>('workflow');

// Basic selectors
export const selectAllWorkflows = createSelector(
  selectWorkflowState,
  (state: WorkflowState) => state.workflows
);

export const selectWorkflowsLoading = createSelector(
  selectWorkflowState,
  (state: WorkflowState) => state.loading
);

export const selectWorkflowsError = createSelector(
  selectWorkflowState,
  (state: WorkflowState) => state.error
);

// Get workflow by ID
export const selectWorkflowById = (id: number) =>
  createSelector(selectAllWorkflows, workflows =>
    workflows.find(w => w.id === id)
  );

// Get workflows by status
export const selectWorkflowsByStatus = (status: WorkflowStatus) =>
  createSelector(selectAllWorkflows, workflows =>
    workflows.filter(w => w.status === status)
  );

// Get pending workflows
export const selectPendingWorkflows = createSelector(
  selectAllWorkflows,
  workflows => workflows.filter(w => w.status === 'pending')
);

// Get approved workflows
export const selectApprovedWorkflows = createSelector(
  selectAllWorkflows,
  workflows => workflows.filter(w => w.status === 'approved')
);

// Get rejected workflows
export const selectRejectedWorkflows = createSelector(
  selectAllWorkflows,
  workflows => workflows.filter(w => w.status === 'rejected')
);

// Get escalated workflows
export const selectEscalatedWorkflows = createSelector(
  selectAllWorkflows,
  workflows => workflows.filter(w => w.status === 'escalated')
);

// Get draft workflows
export const selectDraftWorkflows = createSelector(
  selectAllWorkflows,
  workflows => workflows.filter(w => w.status === 'draft')
);

// Count workflows by status
export const selectWorkflowsCountByStatus = createSelector(
  selectAllWorkflows,
  workflows => ({
    draft: workflows.filter(w => w.status === 'draft').length,
    pending: workflows.filter(w => w.status === 'pending').length,
    approved: workflows.filter(w => w.status === 'approved').length,
    rejected: workflows.filter(w => w.status === 'rejected').length,
    escalated: workflows.filter(w => w.status === 'escalated').length
  })
);

// Get workflows that need action (for current user role)
export const selectWorkflowsNeedingAction = (userRole: 'maker' | 'checker') =>
  createSelector(selectAllWorkflows, workflows => {
    if (userRole === 'maker') {
      return workflows.filter(w => w.status === 'draft' || w.status === 'rejected');
    } else if (userRole === 'checker') {
      return workflows.filter(w => w.status === 'pending');
    }
    return [];
  });

// Check if any workflow is loading
export const selectHasLoadingWorkflows = createSelector(
  selectWorkflowsLoading,
  loading => loading
);
