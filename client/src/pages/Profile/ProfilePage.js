import React, {Component} from 'react';

import Page from '../../components/Page';

import { Container, Form, Header, Segment, Icon, Divider, Message, Tab } from 'semantic-ui-react';
import {getHeaders, getProfile } from '../../config';
import { isNullOrUndefined } from 'util';
import TeamList from './TeamList';

class ProfilePage extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true,
    }
  }

  async componentDidMount(){
    const errorHdr = 'Unable to retrive the user profile.';
    try {
      const {profile, errors} = await getProfile()
      if (errors.length>0) {
        this.setState({loading: false, profile, errors:errors, errorHdr});
      } else {
        this.setState({loading: false, profile, errors:null, errorHdr:null});
      }
    } catch (err) {
      console.error(err);
      this.setState({profile: null, errors:['Unknown error.', 'Please try again.'], loading: false, errorHdr});
    }
  }

  handleChange = async (event) => {
    const {profile} = this.state
    profile.name=event.target.value;
    this.setState({profile})

  }

  handleUpdateProfile = async (e)=>{
    e.preventDefault();
    const {profile} = this.state;
    this.setState({loading: true});
    const headers = getHeaders();
    const errorHdr = 'Unable to update the user profile.';
    const errors=[];
    try{
      headers["Content-type"] = "application/json";
      const body = {
        name: profile.name
      }
      const response = await fetch(`/api/user/${profile._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body)
        });
      if (response.ok) {
        const user = await response.json();
        this.setState({loading: false, profile: user, errors:[], errorHdr: null})
        return;
      }
      if (response.status===401) {
        return this.setState({loading: false, errorHdr:'Not logged in.', errors})
      }
      if (response.status===403) {
        return this.setState({loading: false, errorHdr:'Not Authorized.', errors})
      }
      throw new Error('Invalid status from te server')
    } catch (err) {
      console.error(err);
      if (err.message) {
        errors.push(err.message);
      }
    }
    errors.push('Unknown error.', 'Please try again.');
    this.setState({profile: null, errors, loading: false, errorHdr});
  }

  renderError() {
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  renderDetails(){
    return <Form>
      <Form.Field>
        <label>Email</label>
        <Form.Input value={this.state.profile.email} readOnly/>
      </Form.Field>
      <Form.Field>
        <label>Name</label>
        <Form.Input value={this.state.profile.name} name="name" onChange={this.handleChange}/>
      </Form.Field>
      <Divider/>
      <Form.Group>
        <Form.Button color='blue' onClick={this.handleUpdateProfile}>Update</Form.Button>
      </Form.Group>
    </Form>
  }
  renderTeam(){
    return <TeamList user={this.state.profile._id} editor preload/>
  }
  renderProfile(){
    const {profile} = this.state;
    if (isNullOrUndefined(profile)) return null;
    const panes = [
      { menuItem: 'Details', render: () => <Tab.Pane>{this.renderDetails()}</Tab.Pane> },
      { menuItem: 'Teams', render: () => <Tab.Pane>{this.renderTeam()}</Tab.Pane> },
    ]
    return <Segment>
      <Header as ='h2'><Icon name='user'/> Profile</Header>
      <Divider/>
      <Tab panes={panes} />
    </Segment>
  }
  render() {
    return <Page loading={this.state.loading}>
      <Container>
        {this.renderError()}
        {this.renderProfile()}
      </Container>
    </Page>
  }
}

export default ProfilePage;
