import React, {Component} from 'react';
import { Form, Header, Icon, Button, Divider, Message, Modal, Comment, Loader, Input, Accordion, Grid } from 'semantic-ui-react';

import { getHeaders, getProfile } from '../../config'
import TeamList from './TeamList';

class TeamView extends Component {

  constructor(props){
    super(props);
    const team=this.props.team;
    this.state={
      loggedInUserId: this.props.loggedInUserId,
      newteammember:'',
      name:team.name,
      team:team
    }
  }
  async componentDidMount(){
    try{
      if (this.state.loggedInUserId===undefined){
        const res = await getProfile(); 
        this.setState({loggedInUserId: res.profile._id});
      }
    } catch(err) {
      console.error(err);
    }
  }

  handleChange = (e) => this.setState({newteammember: e.target.value});

  addNewTeamMember = async (e) => {
    e.preventDefault();
    this.setState({loading: true})
    try {
      const headers= getHeaders();

      headers['accept']='application/json';
      headers['content-type']='application/json';
      const add=[];
      const remove=[];
      if (this.state.newteammember) { add.push(this.state.newteammember)}
      const body={add, remove, name: this.state.name};
      const response = await fetch(`/api/team/${this.props.team._id}`, {headers, method:'PUT', body:JSON.stringify(body)})

      if (response.ok) {
        const team = await response.json();
        team.children=team.children||[];
        this.setState({team, name:team.name, loading: false, errorHdr:null, errors:[], newteammember:'', nerror: null})
        return;
      }

      switch(response.status){
        case 401:{
          return this.setState({loading: false, errorHdr:'Not logged in.', errors:[]})
        }
        case 403: {
          return this.setState({loading: false, errorHdr:'Not Authorized.', errors:[]})
        }
        default: throw new Error('Invalid status from the server.')
      }
    } catch (err) {
      this.setState({loading: false, errorHdr:'Unable to add team member.', errors:[]})
    }
  }

  renderErrors(){
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  renderTeamMember=(user)=>{
    return <Comment key={user._id}>
      <Comment.Avatar src='https://react.semantic-ui.com/images/avatar/small/matt.jpg' />
      <Comment.Content>
        <Comment.Author as='a'>{user.email}</Comment.Author>
        <Comment.Metadata>
          <div>{user.createdAt}</div>
        </Comment.Metadata>
        <Comment.Text>SAL1</Comment.Text>
        <Comment.Actions>
          <Comment.Action>x remove</Comment.Action>
        </Comment.Actions>
      </Comment.Content>
    </Comment>
  }
  renderTeamEditButton(){
    const {name, team={}}=this.state;
    const {children=[]}=team;
    return <Modal trigger={<Button icon='edit' size='small'/>}>
      <Modal.Header>Edit team details</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <Form>
            <Form.Field>
              <label>Name</label>
              <Input value={name} placeholder={'\u226A unspecified \u226B'} onChange={e=>this.setState({name: e.target.value})}/>
            </Form.Field>
          </Form>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button color='green' icon='check' onClick={this.addNewTeamMember} content={'Update'}/>
      </Modal.Actions>
    </Modal>
  }
  renderTeamAddMemberButton(){
    const {newteammember, team, nerror} = this.state;
    const i=team.user.email.indexOf('@');
    const domain=team.user.email.substr(i);
    return <Modal trigger={<Icon.Group>
        <Icon name='user' />
        <Icon corner name='add' />
      </Icon.Group>}>
        <Modal.Header>Add Team member</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Form>
              <Form.Field>
                <label>User email</label>
                <Input value={newteammember} placeholder={'someone@'+domain} 
                  error={nerror!==null}
                  onChange={e=>{
                    const i=e.target.value.indexOf('@');
                    let nerror='invalid email domain'
                    if (e.target.value.substr(i)===domain) {
                      nerror=null;
                    }
                    this.setState({newteammember: e.target.value, nerror});
                  }}
                  // label={{ basic: true, content: domain }}
                  // labelPosition='right'
                  />
              </Form.Field>
            </Form>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button color='green' icon='check' onClick={this.addNewTeamMember} content={'Add'} disabled={nerror!==null}/>
        </Modal.Actions>
      </Modal>
  }

  renderTeam() {
    const {name, team={user:{}}, loggedInUserId}=this.state;
    const {children=[]}=team;
    const teamPanels=children.map(c=>{
      return {
        key: c.email,
        title: (!c.name || c.name==='')? c.email:c.name,
        content:{
          content:
          <Grid>
            <Grid.Column width={1}><span>&nbsp;</span></Grid.Column>
            <Grid.Column width={15}> 
              <TeamList user={c._id}/>
            </Grid.Column>
          </Grid>
        }
      }
    })
    console.log(team.name+':'+team.user._id+':'+loggedInUserId)
    return <div>
      {loggedInUserId===team.user._id?<Header as={'h4'} >
        <span> {name===''?'\u226A Team 1 \u226B':name}&nbsp;&nbsp;</span>
          <small>{this.renderTeamEditButton()}</small>
          <small>{this.renderTeamAddMemberButton()}</small>
      </Header>:null}
      {/* children.map((u,i)=>this.renderTeamMember(u)) */}
      <Accordion panels={teamPanels} exclusive={false}/>
    </div>
  }
  render(){
    const {loading} = this.state
    return <div>
      {this.renderErrors()}
      {loading?<Loader active inline>Loading...</Loader>:this.renderTeam()}
    </div>
  }
}

export default TeamView;
