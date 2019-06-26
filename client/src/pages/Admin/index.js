import React from 'react';
import loadable from '@loadable/component'
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

export const AdminSettings = AdminSettingsPage

export const  AdminQuestions = AdminQuestionsPage

export const  AdminUsers = AdminUsersPage 

const Admin = AdminPage

export default Admin
