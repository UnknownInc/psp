import React, {Component} from 'react';

import { Container, Form, Header, Segment, Icon, Divider, Message, Tab } from 'semantic-ui-react';
import { isNullOrUndefined } from 'util';
import TeamTree from './TeamTree';
import OptionsDropdown from '../../components/OptionsDropdown';
import User from '../../domain/User';
import VError from 'verror';

class ProfilePage extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true,
      userid: this.props.userid,
    }
  }

  async componentDidMount(){
    let error;
    let user;
    this.setState({loading: true, error})
    //const errorHdr = 'Unable to retrive the user profile.';
    try {
      user = await User.load({_id:this.state.userid})
    } catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, error, profile:user.toObject()})
    }
  }

  handleChange = async (event) => {
    console.log(event);
    const {profile} = this.state
    profile[event.target.name]=event.target.value;
    this.setState({profile})
  }

  handleUpdateProfile = async (e) => {
    let error;
    let profile=this.state.profile;
    this.setState({loading: true, error})
    try {
      const user = await new User(profile).save();
      profile = user.toObject();
      if (this.props.onChange) {
        this.props.onChange(profile);
      }
    } catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, error, profile})
    }
  }

  // handleUpdateProfile = async (e)=>{
  //   e.preventDefault();
  //   const {profile} = this.state;
  //   this.setState({loading: true});
  //   const headers = getHeaders();
  //   const errorHdr = 'Unable to update the user profile.';
  //   const errors=[];
  //   try{
  //     headers["Content-type"] = "application/json";
  //     const body = {
  //       name: profile.name,
  //       title: profile.title,
  //       capability: profile.capability,
  //       industry: profile.industry
  //     }
  //     const response = await fetch(`/api/user/${profile._id}`, {
  //         method: 'PUT',
  //         headers,
  //         body: JSON.stringify(body)
  //       });
  //     if (response.ok) {
  //       const user = await response.json();
  //       this.setState({loading: false, profile: user, errors:[], errorHdr: null})
  //       return;
  //     }
  //     if (response.status===401) {
  //       return this.setState({loading: false, errorHdr:'Not logged in.', errors})
  //     }
  //     if (response.status===403) {
  //       return this.setState({loading: false, errorHdr:'Not Authorized.', errors})
  //     }
  //     throw new Error('Invalid status from te server')
  //   } catch (err) {
  //     console.error(err);
  //     if (err.message) {
  //       errors.push(err.message);
  //     }
  //   }
  //   errors.push('Unknown error.', 'Please try again.');
  //   this.setState({profile: null, errors, loading: false, errorHdr});
  // }

  renderError() {
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  renderDetails(){
    const {profile} = this.state;
    return <Form>
      <Form.Field>
        <label>Email</label>
        <Form.Input value={profile.email} readOnly/>
      </Form.Field>
      <Form.Field>
        <label>Name</label>
        <Form.Input value={profile.name} name="name" onChange={e=>{
          this.setState({profile:{...profile, name:e.target.value}})
        }}/>
      </Form.Field>
      <Form.Field>
        <label>Title</label>
        <OptionsDropdown opname='title' value={profile.title} onChange={(e,{value})=>{
            this.setState({profile: {...profile, title: value}})
          }} 
          placeholder='Choose Title'
          search selection fluid/>
      </Form.Field>
      <Form.Field>
        <label>Capability</label>
        <OptionsDropdown opname='capability' value={profile.capability} onChange={(e,{value})=>{
            this.setState({profile: {...profile, capability: value}})
          }}
          placeholder='Choose Capability'
          search selection fluid/>
      </Form.Field>
      <Form.Field>
        <label>Industry</label>
        <OptionsDropdown opname='industry' value={profile.industry} onChange={(e,{value})=>{
            this.setState({profile: {...profile, industry: value}})
          }}
          placeholder='Choose Industry'
          search selection fluid/>
      </Form.Field>
      <Divider/>
      <Form.Group>
        <Form.Button color='blue' onClick={this.handleUpdateProfile}>Update</Form.Button>
      </Form.Group>
    </Form>
  }
  renderTeam(){
    //return <TeamList user={this.state.profile._id} editor preload/>
    return <TeamTree user={this.state.profile._id}/>
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
    return <Segment loading={this.state.loading} basic>
      <Container>
        {this.renderError()}
        {this.renderProfile()}
      </Container>
    </Segment>
  }
}

export default ProfilePage;
