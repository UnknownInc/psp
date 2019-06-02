import React, { Component } from 'react'
import QuestionCard from '../components/QuestionCard/QuestionCard'
import Page from '../components/Page';
import { Segment } from 'semantic-ui-react';

export default class Home extends Component {

  render(){
    const {profile} = this.props;
    return <Page center>
      <Segment basic>
       <QuestionCard profile={profile}/>
      </Segment>
    </Page>
  }
}
