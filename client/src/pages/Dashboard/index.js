import React from 'react';
import loadable from '@loadable/component'
import Page from '../../components/Page';


const Dashboard = loadable(() => import('./DashboardPage'), {
  fallback:<Page loading={true}>...</Page>,
})

export default class DashboardPage extends React.Component {
  render() {
    return <Dashboard {...this.props}/>;
  }
}