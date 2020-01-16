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
      this.setState({loading: false, error, profile:user?user.toObject():null})
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

  renderError() {
    const {error} = this.state;
    if (!error) return null
    return <Message error header={error.message} list={error.cause} />
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
    return <TeamTree user={this.state.profile._id}/>
  }
  renderProfile(){
    const {profile} = this.state;
    if (isNullOrUndefined(profile)) {
      return <Message error header='Not logged in.'></Message>;
    }
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
