import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import projectReducer from './slices/projectSlice';
import taskReducer from './slices/taskSlice';
import dashboardReducer from './slices/dashboardSlice';
import notificationReducer from './slices/notificationSlice';
import adminReducer from './slices/adminSlice';
import todoReducer from './slices/todoSlice';
import timeReducer from './slices/timeSlice';
import departmentReducer from './slices/departmentSlice';
import chatReducer from './slices/chatSlice';
import leaveReducer from './slices/leaveSlice';
import templateReducer from './slices/templateSlice';
import documentReducer from './slices/documentSlice';
import moduleReducer from './slices/moduleSlice';
import clientReducer from './slices/clientSlice';
import payrollReducer from './slices/payrollSlice';
import performanceReducer from './slices/performanceSlice';
import onboardingReducer from './slices/onboardingSlice';
import roleReducer from './slices/roleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    projects: projectReducer,
    tasks: taskReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
    admin: adminReducer,
    todos: todoReducer,
    time: timeReducer,
    departments: departmentReducer,
    chat: chatReducer,
    leaves: leaveReducer,
    templates: templateReducer,
    documents: documentReducer,
    module: moduleReducer,
    clients: clientReducer,
    payroll: payrollReducer,
    performance: performanceReducer,
    onboarding: onboardingReducer,
    roles: roleReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
