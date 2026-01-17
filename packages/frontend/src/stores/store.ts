import { configureStore } from '@reduxjs/toolkit';
import videoReducer from './videoSlice';
import projectReducer from './projectSlice';

export const store = configureStore({
  reducer: {
    video: videoReducer,
    project: projectReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
