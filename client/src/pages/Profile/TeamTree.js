import React,{Component} from 'react'
import VError from 'verror';

import {Header, Segment, Modal, Form, Button, Input, Icon, Message, Popup, Confirm} from 'semantic-ui-react';


import SortableTree,{changeNodeAtPath, removeNodeAtPath, addNodeUnderParent, getNodeAtPath} from 'react-sortable-tree';
// Or you can import the tree without the dnd context as a named export. eg
//import { SortableTreeWithoutDndContext as SortableTree } from 'react-sortable-tree';

import Team from '../../domain/Team';
import ResponsiveButton from '../../components/ResponsiveButton';
import OptionsDropdown from '../../components/OptionsDropdown';
import User from '../../domain/User';

export default class TeamTree extends Component {
  constructor(props){
    super(props);
    this.state ={
      loading: true,
      teams:[],
      treeData:[],
      lastMovePrevPath: null,
      lastMoveNextPath: null,
      lastMoveNode: null,
    }
  }

  handleAddMember=async (team, path)=>{
    this.setState({eteam: team, epath:path, openAddNewUserModal: true, error: null});
  }

  onCloseAddNewUserModal=()=>{
    this.setState({eteam: null, epath: null, openAddNewUserModal: false, error: null})
  }

  addUser=async ()=>{
    this.setState({loading: true});
    const {eteam, epath, newMember, treeData}=this.state;
    let openAddNewUserModal = this.state.openAddNewUserModal
    let error=null;
    try {
      const email = newMember.trim().toLowerCase();
      await eteam.addMember(email);
      //await this.loadTeams();
      const usr = eteam.children.find(u=>u.email===email);
      const r = addNodeUnderParent({
        treeData,
        newNode:{
          id:usr._id,
          title:usr.name,
          subtitle: usr.title+', '+usr.email,
          type: 'user',
          o:usr,
        },
        parentKey:epath,
        getNodeKey: this.getNodeKey
      })
      this.setState({ treeData: r.treeData});
      openAddNewUserModal=false;
    } catch(err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, openAddNewUserModal, error})
    }
  }

  removeUser=async (team, oldUser)=>{
    this.setState({loading: true});
    let error=null;
    try {
      const email = oldUser.trim().toLowerCase();
      await team.removeMember(email);
    } catch(err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
      throw err;
    } finally {
      this.setState({loading: false, error})
    }
  }

  deleteTeam=async (team)=>{
    this.setState({loading: true});
    let error=null;
    try {
      await team.delete()
    } catch(err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
      throw err;
    } finally {
      this.setState({loading: false, error})
    }
  }
  updateTeamName=async ()=>{
    this.setState({loading: true});
    const {eteam, newTeamName, epath} = this.state;
    let error=null;
    let showTeamEditModal = true;
    let treeData = this.state.treeData
    try {
      const team = new Team(eteam.toObject());
      team.name=newTeamName;
      await team.save()
      showTeamEditModal=false;

      treeData = changeNodeAtPath({
        treeData: treeData,
        path: epath,
        newNode:this._getTreeData([team])[0],
        getNodeKey: this.getNodeKey,
        ignoreCollapsed: false
      })

    } catch(err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, error, showTeamEditModal, treeData})
    }
  }

  getNodeKey = ({ node, treeIndex }) => treeIndex;

  _getChildrenTreeData = (team, _tdata) => {
    const data=[];
    team.children.forEach(c=>{
      data.push({
        id:c._id,
        title:c.name,
        subtitle: c.title+', '+c.email,
        type: 'user',
        o:c
      })
    })
    return data;
  }

  _getTreeData = (teams)=>{
    return teams.map(t=>{
      const tdata={
        id: t._id,
        title: t.name,
        subtitle:t.type,
        expanded:false,
        type: 'team',
        o:t
      }
      tdata.children = this._getChildrenTreeData(t, tdata)
      return tdata;
    })
  }

  async componentDidMount() {
    await this.loadTeams();
  }

  loadTeams= async ()=>{
    this.setState({loading: true});
    let error=null;
    let teams=[...this.state.teams];
    let treeData=[...this.state.treeData];
    try{
      teams = await Team.load({userid: this.props.user});
      treeData = this._getTreeData(teams);
    } catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, error, teams, treeData})
    }
  }

  createTeam = async ()=>{
    this.setState({loading: true})
    let teams=[...this.state.teams];
    let treeData=[...this.state.treeData];
    let error=null;
    let openNewTeamModal = this.state.openNewTeamModal;
    try {
      const newTeam = new Team({
        name: this.state.newTeamName,
        type: this.state.teamType,
        user: new User({_id:this.props.user})
      })

      await newTeam.save();
      teams.push(newTeam);
      treeData = this._getTreeData(teams);
      openNewTeamModal=false;
    } catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, error, teams, treeData, openNewTeamModal})
    }
  }

  handleTreeChange = (treeData) => {
    this.setState({ treeData });
  }

  handleNewTeam = ()=>{
    this.setState({openNewTeamModal: true, error: null})
  }

  onCloseNewTeamModal = () => {
    this.setState({openNewTeamModal: false, error: null});
  }

  removeNode = (node, path) => {
    console.log(path);
    let pnode = getNodeAtPath({
      treeData:this.state.treeData,
      path:path.slice(0,path.length-1),
      getNodeKey: this.getNodeKey}).node;
    let action;
    if (node.type==='user') {
      action = this.removeUser(pnode.o, node.o.email)
    } else if (node.type==='team') {
      action = this.deleteTeam(node.o);
    }

    if (!action) return;

    this.removeAction={node, action, path};

    this.setState({showDeleteConfirmation: true, rnode: node});
  }

  handleRemoveConfirm = async () => {
    if (this.removeAction) {
      this.setState({ loading: true, showDeleteConfirmation: false });
      let error = null;
      let treeData = this.state.treeData;
      try {
        await this.removeAction.action;

        treeData = removeNodeAtPath({
          treeData: this.state.treeData,
          path: this.removeAction.path,
          getNodeKey: this.getNodeKey,
          ignoreCollapsed: true,
        })
      } catch (err) {
        console.error(err);
        error = {
          header: err.message,
          cause: VError.cause(err),
        }
      } finally {
        this.removeAction = null;
        this.setState({ loading: false, error, rnode: null, treeData })
      }
    }
  }

  handleRemoveCancel = ()=>{
    this.removeAction=null;
    this.setState({showDeleteConfirmation: false});
  }

  handleNameChange = (team, path)=>{
    console.log(path);
    this.setState({eteam: team, epath: path, showTeamEditModal: true, newTeamName: team.name})
  }

  onCancelTeamEdit = () => {
    this.setState({showTeamEditModal: false, eteam: null, epath: null})
  }

  handleShowTeams=async (node, path)=>{
    this.setState({loading: true});
    let error=null;
    const user = node.o;
    let treeData = this.state.treeData;
    try{
      console.log(path);
      const pnode= getNodeAtPath({
        treeData: treeData,
        path:path.slice(0,path.length-1),
        getNodeKey: this.getNodeKey,
      }).node;
      console.log(pnode);
      let tname;
      if (pnode.o.type==='Community') {
        tname=pnode.o.name;
      }
      const teams = await Team.load({userid: user._id, type: pnode.o.type, name: tname});

      node.children = this._getTreeData(teams);

      treeData = changeNodeAtPath({
        treeData: treeData,
        newNode: node,
        path: path,
        getNodeKey: this.getNodeKey,
      })

    } catch (err) {
      console.error(err);
      error = {
        header: err.message,
        cause: VError.cause(err),
      }
    } finally {
      this.setState({loading: false, error, treeData})
    }
  }

  renderControls() {
    return <Segment basic>
      <ResponsiveButton onClick={this.handleNewTeam} icon='users'text='New Team' minWidth={768}/>
    </Segment>
  }

  traceLog = (name, args) => {
    // eslint-disable-next-line no-console
    console.log(`${name} called with arguments:`, args);
  };

  render() {
    const {error } = this.state; // lastMovePrevPath, lastMoveNextPath, lastMoveNode, 

    return <Segment basic loading={this.state.loading}>
        {this.props.noheader?null:<Header as='h3'>Teams</Header>}
        {this.props.nocontrols?null:this.renderControls()}
        {error?<Message error>
            <Message.Header>{error.header}</Message.Header>
          </Message>:null}
        <SortableTree style={{minHeight: 500}}
          getNodeKey={this.getNodeKey}
          treeData={this.state.treeData}
          canDrop={e=>{
            console.log(e);
            if (e.nextParent && e.node.type==='user' && e.nextParent.type==='team') {
              return true;
            }
            if (e.nextParent && e.node.type==='team' && e.nextParent.type==='user') {
              return true;
            }
            return false;
          }}
          canDrag={_n=>{
            return false;
            //return !(n.node.id.startsWith('_'));
          }}
          canNodeHaveChildren={n=>{
            return !(n.id.startsWith('_'));
          }}
          onChange={this.handleTreeChange}
          generateNodeProps={this.renderNode}
          onMoveNode={args => {
            this.traceLog('onMoveNode', args);
            const { prevPath, nextPath, node } = args;
            this.setState({
              lastMovePrevPath: prevPath,
              lastMoveNextPath: nextPath,
              lastMoveNode: node,
            });
          }}
          onDragStateChanged={args => { this.traceLog('onDragStateChanged', args)} }
        />
        {this.renderNewTeamModal()}
        {this.renderAddTeamMemberModal()}
        <Confirm
          open={this.state.showDeleteConfirmation}
          content='Are you sure you want to remove?'
          cancelButton='Cancel'
          confirmButton="Delete"
          onCancel={this.handleRemoveCancel}
          onConfirm={this.handleRemoveConfirm}
        />
        {this.renderTeamEditModal()}
      </Segment>
  }

  renderNode=({ node, path }) => {
    const buttons=[];
    let color='black';
    let addInfo='';

    if (node.type==='team') {
      buttons.push(
        <Popup content='Edit team name' trigger={(
          <Icon name='pencil alternate' onClick={_e=>{this.handleNameChange(node.o, path)}} style={{marginRight:'1.5em'}}/>)}
        />
      )

      buttons.push(
        <Popup content='Add users to the team' trigger={(
          <Icon.Group onClick={_e=>{this.handleAddMember(node.o, path[path.length-1])}} 
            style={{marginRight:'1.5em'}}>
            <Icon name='user'/>
            <Icon corner name='add' color='green' />
          </Icon.Group>)} />
      )
    } else {
      if (!node.o.isVerified){
        color='darkred';
      }
      if (node.o.lastresponsedate) {
        addInfo=`( ${node.o.lastresponsedate.fromNow(true)} )`
      }
      buttons.push(
        <Popup content='Show Teams' trigger={(
          <Icon name='users' onClick={_e=>{this.handleShowTeams(node, path)}} style={{marginRight:'1.5em'}}/>)}
        />
      )
    }

    buttons.push(
      <Popup content={'Remove'} trigger={(
        <Icon name='close' color='grey' onClick={_e=>{ this.removeNode(node, path)}}/>
      )}/>
    )
    
    return {
      style:{backgroundColor:'lightgray'},
    title: (<span style={{color}}>{node.title}{addInfo}</span>),
      subtitle:(<span style={{}}>{node.subtitle}</span>),
      buttons,
    }
  }

  renderTeamEditModal() {
    const {showTeamEditModal, loading, error, newTeamName} = this.state
    return <Modal open={showTeamEditModal} onClose={this.onCancelTeamEdit}>
      <Modal.Header>Edit Team Name</Modal.Header>
      <Modal.Content>
        <Segment basic loading={loading}>
          {error?<Message error>
            <Message.Header>{error.header}</Message.Header>
          </Message>:null}
          <Form>
            <Form.Field>
              <label>Team Name</label>
              <Input fluid
                placeholder='New Team Name' 
                value={newTeamName} 
                onChange={e=>this.setState({newTeamName: e.target.value})}/>
            </Form.Field>
          </Form>
        </Segment>
      </Modal.Content>
      <Modal.Actions>
        <Button color='green' onClick={this.updateTeamName}>Update</Button>
        <Button onClick={this.onCancelTeamEdit}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  }

  renderNewTeamModal() {
    const {teamType, newTeamName, loading, error} = this.state;
    return <Modal open={this.state.openNewTeamModal} onClose={this.onCloseNewTeamModal}>
      <Modal.Header>New Team</Modal.Header>
      <Modal.Content>
        <Segment basic loading={loading}>
          {error?<Message error>
            <Message.Header>{error.header}</Message.Header>
          </Message>:null}
        <Form>
          <Form.Field>
            <label>Team Name</label>
            <Input fluid
              placeholder='New Team Name' 
              value={newTeamName} 
              onChange={e=>this.setState({newTeamName: e.target.value})}/>
          </Form.Field>
          <Form.Field>
            <label>Type</label>
            <OptionsDropdown  
              opname='teamtype'
              placeholder='Select Team Type'
              fluid
              selection
              value={teamType}
              onChange={(_e,{value})=> this.setState({teamType: value})}
            />
          </Form.Field>
        </Form>
        </Segment>
      </Modal.Content>
      <Modal.Actions>
        <Button color='green' onClick={this.createTeam}>Create</Button>
        <Button onClick={this.onCloseNewTeamModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  }


  renderAddTeamMemberModal() {
    const {loading, newMember, error} = this.state;
    return <Modal open={this.state.openAddNewUserModal} onClose={this.onCloseAddNewUserModal}>
      <Modal.Header>New Team Member</Modal.Header>
      <Modal.Content>
        <Segment basic loading={loading}>
          {error?<Message error>
              <Message.Header>{error.header}</Message.Header>
            </Message>:null}
          <Form>
            <Form.Field>
              <label>Team Member Email</label>
              <Input fluid
                placeholder='email' 
                value={newMember} 
                onChange={e=>this.setState({newMember: e.target.value})}/>
            </Form.Field>
          </Form>
        </Segment>
      </Modal.Content>
      <Modal.Actions>
        <Button color='green' onClick={this.addUser}>Create</Button>
        <Button onClick={this.onCloseAddNewUserModal}>Cancel</Button>
      </Modal.Actions>
    </Modal>
  }
}