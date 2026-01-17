import { configureStore } from '@reduxjs/toolkit';
import videoReducer from './videoSlice';
import projectReducer from './projectSlice';
import historyReducer from './historySlice';
import { historyMiddleware } from './historyMiddleware';

export const store = configureStore({
  reducer: {
    video: videoReducer,
    project: projectReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(historyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
