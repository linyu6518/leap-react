import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { mockDataService } from '@services/mockDataService'

export type WorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'escalated'

export interface Workflow {
  id: number
  title: string
  status: WorkflowStatus
  submittedBy: string
  submittedAt: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  commentary?: string
}

interface WorkflowState {
  workflows: Workflow[]
  loading: boolean
  error: any
}

const initialState: WorkflowState = {
  workflows: [],
  loading: false,
  error: null,
}

// Async thunks
export const loadWorkflowsAsync = createAsyncThunk(
  'workflow/loadWorkflows',
  async (_, { rejectWithValue }) => {
    try {
      const workflows = await mockDataService.getWorkflows()
      return { workflows: workflows || [] }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load workflows')
    }
  }
)

export const updateWorkflowStatusAsync = createAsyncThunk(
  'workflow/updateStatus',
  async ({ id, status }: { id: number; status: WorkflowStatus }, { rejectWithValue }) => {
    try {
      await mockDataService.updateWorkflowStatus(id, status)
      return { id, status }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update workflow status')
    }
  }
)

export const addCommentaryAsync = createAsyncThunk(
  'workflow/addCommentary',
  async ({ workflowId, content }: { workflowId: number; content: string }, { rejectWithValue }) => {
    try {
      await mockDataService.addCommentary(workflowId, content)
      return { workflowId, content }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add commentary')
    }
  }
)

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Load workflows
      .addCase(loadWorkflowsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadWorkflowsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.workflows = action.payload.workflows
        state.error = null
      })
      .addCase(loadWorkflowsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update workflow status
      .addCase(updateWorkflowStatusAsync.fulfilled, (state, action) => {
        const { id, status } = action.payload
        state.workflows = state.workflows.map((w) =>
          w.id === id ? { ...w, status } : w
        )
      })
      // Add commentary
      .addCase(addCommentaryAsync.fulfilled, (state, action) => {
        const { workflowId, content } = action.payload
        state.workflows = state.workflows.map((w) =>
          w.id === workflowId ? { ...w, commentary: content } : w
        )
      })
  },
})

export default workflowSlice.reducer
