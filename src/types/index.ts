export type TaskStatus = 'todo' | 'needs-pickup' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type UserRole = 'manager' | 'user';
export type BoardType = 'voorwinkel' | 'achterwinkel';

export interface User {
  id: string;
  employeeNumber: string;
  // backend levert (soms) ook deze:
  username?: string;
  name?: string;
  role: UserRole;
  // optioneel: sommige UIs gebruiken dit, maar backend levert het (nog) niet
  boards?: BoardType[];
  // login-flow flags (optioneel)
  isFirstLogin?: boolean;
  temporaryCode?: string;
  hasPassword?: boolean;
}

export interface TaskActivity {
  id: string;
  type: 'created' | 'moved' | 'assigned' | 'updated' | 'completed';
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;

  // optioneel/afhankelijk van UI
  description?: string;
  assignedTo?: string;
  assignedToName?: string;

  startedBy?: string;
  startedByName?: string;
  startedAt?: string;

  pickedUpBy?: string;
  pickedUpByName?: string;
  pickedUpAt?: string;

  completedBy?: string;
  completedByName?: string;
  completedAt?: string;

  board: BoardType;
  deadline?: string;

  createdAt: string;
  updatedAt: string;

  // AppContext garandeert [] als default
  activities: TaskActivity[];
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  currentBoard: BoardType;
}
