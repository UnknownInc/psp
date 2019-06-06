import React from 'react';
import loadable from '@loadable/component'
import Page from '../../components/Page';


const Reports = loadable(() => import('./ReportsPage'), {
  fallback:<Page loading={true}>...</Page>,
})

export default class ReportsPage extends React.Component {
  render() {
    return <Reports />;
  }
}
