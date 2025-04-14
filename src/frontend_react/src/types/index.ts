// Auth Types
export interface AuthHeaders {
  'Content-Type': string;
  'X-Ms-Client-Principal': string;
  'X-Ms-Client-Principal-Id': string;
  'X-Ms-Client-Principal-Name': string;
  'X-Ms-Client-Principal-Idp': string;
}

export interface UserClaim {
  typ: string;
  val: string;
}

export interface UserDetails {
  client_principal: string;
  user_claims: UserClaim[];
  identity_provider: string;
}

export interface UserInfo {
  name: string;
  authenticated: boolean;
}

// Task Types
export interface Task {
  session_id: string;
  plan_id?: string;
  initial_goal: string;
  overall_status: 'completed' | 'in-progress' | 'planned' | 'rejected' | string;
  completed: number;
  total_steps: number;
  steps?: TaskStage[];
  agents?: TaskAgent[];
}

export interface TaskStage {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | string;
  description?: string;
}

export interface TaskAgent {
  id: string;
  name: string;
  type: 'ai' | 'human' | string;
}

export interface TaskMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  timestamp: string | Date;
}

export interface CurrentTask {
  id: string;
  name: string;
  planId?: string;
  data?: Task;
}

export interface TaskStats {
  completed: number;
  inProgress: number;
}

// Component Props
export interface SidebarProps {
  onGoHome: () => void;
  onNewTask: () => void;
  onTaskSelect: (taskId: string, taskName: string) => void;
  tasks: Task[];
  stats: TaskStats;
  activePath: string;
}

export interface LoadingSpinnerProps {
  message?: string;
}

export interface ModalProps {
  isActive: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

export interface TaskPageProps {
  onOpenAgentsModal: () => void;
  onOpenWorkflowModal: () => void;
  onOpenHistoryModal: () => void;
}

// Context Types
export interface AuthContextType {
  authHeaders: AuthHeaders | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
}

export interface TaskContextType {
  tasks: Task[];
  currentTask: CurrentTask | null;
  isLoading: boolean;
  taskStats: TaskStats;
  createTask: (description: string) => Promise<CurrentTask | null>;
  selectTask: (sessionId: string, taskName: string) => void;
  clearCurrentTask: () => void;
  addMessageToTask: (message: string) => Promise<any>;
  fetchTasks: () => Promise<void>;
}

// Declare global window properties
declare global {
  interface Window {
    BACKEND_API_URL: string;
  }
}