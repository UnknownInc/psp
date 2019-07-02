import React from 'react';
import loadable from '@loadable/component'
import Page from '../../components/Page';


const Profile = loadable(() => import('./ProfilePage'), {
  fallback:<Page loading={true}>...</Page>,
})

export default class ProfilePage extends React.Component {
  render() {
    return <Page><Profile {...this.props}/></Page>;
  }
}
