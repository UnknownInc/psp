import React from 'react';
import loadable from '@loadable/component'
import Spinner from "../../components/Spinner";
import { Loader } from 'semantic-ui-react';

const LoadingView = props => {
  return <Loader>Loading...</Loader>
}
const AdminPage = loadable(() => import('./AdminPage'), {
  fallback: LoadingView,
})

const AdminQuestionsPage = loadable(() => import('./AdminQuestionsPage'), {
  fallback: LoadingView,
})

const AdminSettingsPage = loadable(() => import('./AdminSettingsPage'), {
  fallback: LoadingView,
})

const AdminUsersPage = loadable(() => import('./AdminUsersPage'), {
  fallback: LoadingView,
})

export function AdminSettings(){
  return <AdminSettingsPage />
}
export function AdminQuestions(){
  return <AdminQuestionsPage />
}
export function AdminUsers(){
  return <AdminUsersPage />
}
export default function Admin() {
  return <AdminPage />
}
