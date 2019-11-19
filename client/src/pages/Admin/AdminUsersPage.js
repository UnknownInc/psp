import React, {Component} from 'react';
import { Header, Button, Icon, Message, 
  Segment, Table, Checkbox, 
  Popup, Modal, Form, FormButton, Label, Menu, 
  Accordion, Input, Progress } from 'semantic-ui-react';
import { isNullOrUndefined } from 'util';
import { getProfile, getHeaders } from '../../config'
import moment from 'moment';
import csv from "fast-csv";
import uuidv1 from 'uuid/v1';
import VError from 'verror';
import Page from '../../components/Page';
import ResponsiveButton from '../../components/ResponsiveButton'
import ProfilePage from '../Profile/ProfilePage';
import User from '../../domain/User';
import OptionsDropdown from '../../components/OptionsDropdown';
import Team from '../../domain/Team';

import ReactExport from "react-export-excel";
  
const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

function isNotEmpty(str) {
  if (!str) return false;

  if (str.trim()==='') return false;

  return true;
}
class AdminUsersPage extends Component {
  constructor(props){
    super(props);
    this.fileInput = React.createRef();
    this.state={
      loading: true,
      offset:0,
      limit: 25,
      users:[],
      totalUsersCount: 0,
      sortColumn:'name',
      sortDirection:1
    }
  }

  async componentDidMount(){
    try {
      this.loadUsers();
      const {profile} = await getProfile();
      if (profile) {
        const idx= profile.email.indexOf('@');
        const domain=profile.email.substr(idx+1);
        this.setState({profile,domain})
      }
    } catch (err) {
      console.error(err);
    }
  }

  onCloseUploadModal = (e) =>{
    e.preventDefault()
    this.setState({openUploadModal: false})
  }
  onCloseNewUserModal = (e) =>{
    e.preventDefault()
    this.setState({openNewUserModal: false})
  }


  handleSort = clickedColumn => () => {
    const { sortDirection, sortColumn } = this.state

    if (sortColumn !== clickedColumn) {
      this.setState({
        sortColumn: clickedColumn,
        sortDirection: 'ascending',
      },()=>this.loadUsers())
      return
    }
    this.setState({
      sortDirection: sortDirection[0] === 'a' ? 'descending' : 'ascending',
    }, ()=>this.loadUsers())
  }

  loadPage = (pageNumber) => {
    this.setState({offset: (pageNumber-1)*this.state.limit, loading: true},()=>this.loadUsers());
  }
  loadUsers = async ()=>{
    try {
      this.setState({loading: true, error:null});
      const headers=getHeaders();
      let url = `/api/user?offset=${this.state.offset}&limit=${this.state.limit}&sort=${this.state.sortDirection[0]==='d'?'-':''}${this.state.sortColumn}`;
      if ( isNotEmpty(this.state.nameFilter)) {
        url+=`&name=${this.state.nameFilter}`
      }
      if ( isNotEmpty(this.state.emailFilter)) {
        url+=`&email=${this.state.emailFilter}`
      }
      if (isNotEmpty(this.state.capabilityFilter)){
        url+=`&c=${this.state.capabilityFilter}`
      }
      if (isNotEmpty(this.state.industryFilter)){
        url+=`&i=${this.state.industryFilter}`
      }
      if (isNotEmpty(this.state.titleFilter)){
        url+=`&t=${this.state.titleFilter}`
      }
      const res = await fetch(url, { headers})

      if (!res.ok) {
        return this.setState({loading: false, error:{header:res.statusText}})
      }

      const totalUsersCount = parseInt(res.headers.get('x-total-count'));
      const data = await res.json()
      this.setState({loading: false, users:[...data], totalUsersCount})

    } catch (err) {
      const error={header:'Unable to load users.'}
      error.errors=[ JSON.stringify(err)];
      this.setState({loading: false, error})
    }
  }

  handleNewUser = async () => {
    this.setState({openNewUserModal: true});
  }

  createNewUser = async ()=>{
    const nuser = this.state.newUserEmail;
    try{
      let u = await User.getByEmail(nuser);
      if (!u) {
        u= new User({email:nuser});
        await u.save()
        this.setState({openNewUserModal: false, newUserEmail:''});
      } else {
      }
    } catch (ex) {
      console.error(ex);
      this.setState({nerror:`unable to add new user:${nuser}`, openNewUserModal: false})
    }
  }

  handleUploadUsers = async () => {
    this.setState({openUploadModal: true});
  }

  handleUpload = event => {
    event.preventDefault();
    const fileData = this.state.filePreview || "";
    const newItems = [];
    const users = this.state.users;
    csv.fromString(fileData,{headers: true, delimiter:','})
      .on('data', (data)=>{
        const _id="new"+uuidv1();
        const oid = data['ORACLE_ID'];
        const email=(data['EMAIL_ADDRESS']||'').trim().toLowerCase();
        const name=data['Full Name']||'';
        const title = data['TITLE_NAME']||'';
        const careerStage = data['CAREER_STAGE']||'';
        const clients = data['CLIENT_NAME']? [data['CLIENT_NAME']]:[];
        const industry = data['Industry']||'';
        const capability = data['Capability']||'';
        const skills=data['Skills']?[data['Skills']]:[];
        const newUser= {
          _id, 
          email,
          name,
          title,
          careerStage,
          clients,
          industry,
          capability,
          skills,
          oid,
          teams:[]
        }
        if (data['Communities']){
          let com=data['Communities'].split(',');
          
        }
        if (data['Project Team'] && data['Project Team Lead Email']) {
          newUser.teams.push({type:'ProjectTeam', lead:data['Project Team Lead Email'], name:data['Project Team']})
        }
        if (data['Supervisor']) {
          newUser.teams.push({type:'Reportees', lead:data['Supervisor'], name:'Directs'});
        }
        if (data['Mentor']) {
          newUser.teams.push({type:'Mentees', lead:data['Mentor'], name:'Mentees'});
        }

        const idx = users.findIndex(u=>u.email===newUser.email.trim().toLowerCase());
        if (idx===-1) {
          newItems.push(newUser)
        } else {
          users[idx].title = newUser.title||users[idx].title;
          users[idx].careerStage = newUser.careerStage||users[idx].careerStage;
          users[idx].capability = newUser.capability||users[idx].capability;
          users[idx].industry = newUser.industry||users[idx].industry;
          users[idx].oid = newUser.oid||users[idx].oid;

          users[idx].clients = [...(new Set([...users[idx].clients||[], ...newUser.clients]))];
          users[idx].skills = [...(new Set([...users[idx].skills||[], ...newUser.skills]))];
          users[idx].teams=newUser.teams;
          users[idx].isModified=true;
        }
      })
      .on('end', () => {
        this.setState({
          openUploadModal: false,
          users:[...newItems,...this.state.users],
        })
      })
  }

  handlePreview = () => {
    const currentFile = this.fileInput.current.files[0];
    if (!currentFile) {
      this.setState({ filePreview: "", fileData:""})
      return;
    }
    if (currentFile.type!=='text/csv'){
      this.setState({ filePreview: "Unsupported type. Please specify a csv file", fileData:""})
    } else {
      const fr = new FileReader();
      fr.onload = ()=>{
        this.setState({ filePreview: fr.result, fileData: fr.result})
      };
      fr.readAsText(currentFile);
    }
  }

  _addToTeams = async (user)=>{
    user.teams.forEach(async (tm)=>{
      let lu = await User.getByEmail(tm.lead);
      if (!lu) {
        lu=new User({email: tm.lead})
        await lu.save();
      }

      let lteams = await Team.load({userid: lu._id, type: tm.type})
      // eslint-disable-next-line no-loop-func
      let tteam=lteams.filter((lt)=>(lt.name===tm.name))[0];
      if (!tteam) {
        tteam=new Team({name: tm.name, user: lu.toObject(), type:  tm.type})
        await tteam.save();
      }
      await tteam.addMember(user.email);
    });
  }

  handleSaveChanges = async ()=>{
    let error=null;
    let users=[...this.state.users];
    let nusers = this.state.users.filter(u=>(u._id.startsWith('new')||u.isModified));
    let updateInfo={};
    let i=0;
    if (nusers.length===0) return;
    this.setState({updatingUsers: true});
    try {

      updateInfo.current = 0;
      updateInfo.total = nusers.length;

      do {
        let idx=0;
        try {
          let u = await User.getByEmail(nusers[i].email);
          if (!u) {
            u= new User(nusers[i]);
          } else {
            u.set({...nusers[i], _id: u._id});
          }
          idx=users.findIndex(usr=>usr._id===u._id);
          await u.save()

          //create teams
          // let t=0;
          // while(t<nusers[i].teams.length) {
          //   let lu = await User.getByEmail(nusers[i].teams[t].lead);
          //   if (!lu) {
          //     lu=new User({email: nusers[i].teams[t].lead})
          //     await lu.save();
          //   }

          //   let lteams = await Team.load({userid: lu._id, type: nusers[i].teams[t].type})
          //   // eslint-disable-next-line no-loop-func
          //   let tteam=lteams.filter((lt)=>(lt.name===nusers[i].teams[t].name))[0];
          //   if (!tteam) {
          //     tteam=new Team({name: nusers[i].teams[t].name, user: lu.toObject(), type:  nusers[i].teams[t].type})
          //     await tteam.save();
          //   }
          //   await tteam.addMember(u.email);
          //   t++;
          // }
          try {
            await this._addToTeams(nusers[i]);
          } catch(ex) {
            console.error('Unable to add teams to the user', ex);
          }

          users[idx]=u.toObject();
        }
        catch(ex) {
          users[idx].hasError=true;
        } finally {
          i+=1;
          updateInfo.current=i;
          this.setState({updateInfo, users})
        }
      } while(i<updateInfo.total)
    } catch (err) {
        console.error(err);
        error = {
          header: err.message,
          cause: VError.cause(err),
        }
      } finally {
        this.setState({updatingUsers: false, error})
      }
  }

  renderError(){
    const {error} = this.state;
    if (isNullOrUndefined(error)) return null;

    const {header='', errors=[]} = error;
    return <Message error header={header} list={errors} />
  }

  renderFilterBar(){
    return <Segment>
      <Accordion panels={[
        { 
          key: 'filterpane',
          title: {
            content:<span><Icon name='filter'/> Filter Options</span>
          },
          content:{
            content:
            <Form>
              <Form.Group widths='equal'>
                <Form.Field control={Input} label='Name' placeholder='ra*' value={this.state.nameFilter} 
                  onChange={e=>this.setState({nameFilter: e.target.value})}/>
                <Form.Field control={Input} label='Email' placeholder='rak*' value={this.state.emailFilter} 
                  onChange={e=>this.setState({emailFilter: e.target.value})}/>
                {/* <Form.Field control={Select} label='Gender' options={options} placeholder='Gender' /> */}
              </Form.Group>
              <Form.Group widths='equal'>
                <Form.Field>
                  <label>Capability</label>
                  <OptionsDropdown opname='capability' value={this.state.capabilityFilter} selection clearable
                    onChange={(_,{value})=>this.setState({capabilityFilter: value})}/>
                </Form.Field>
                <Form.Field>
                  <label>Industry</label>
                  <OptionsDropdown opname='industry' value={this.state.industryFilter} selection clearable
                    onChange={(_,{value})=>this.setState({industryFilter: value})}/>
                </Form.Field>
                <Form.Field>
                  <label>Title</label>
                  <OptionsDropdown opname='title' value={this.state.titleFilter} selection clearable
                    onChange={(_,{value})=>this.setState({titleFilter: value})}/>
                </Form.Field>
              </Form.Group>
              <Form.Group>
                <Form.Field control={Button} onClick={this.loadUsers}>Refresh</Form.Field>
                <Form.Field control={Button} onClick={()=>{
                  this.setState({nameFilter:'', emailFilter:'', capabilityFilter:null, industryFilter: null,
                    titleFilter:null,
                  })
                }}>Clear</Form.Field>
              </Form.Group>
              
            </Form>
          }
        }
      ]}/>
    </Segment>
  }

  renderUsers(){
    const {users, sortColumn, sortDirection, updatingUsers, updateInfo={}} = this.state;
    const pages=[];
    let i=0;
    do{
      i++
      pages.push(i);
    }
    while(i<(this.state.totalUsersCount/this.state.limit));

    const currentPage = Math.trunc((this.state.offset+1)/this.state.limit)+1;
    return <div>
      <Segment attached='top'>
        <Button.Group color='blue'>
          <ResponsiveButton onClick={this.handleNewUser} icon='user'text='New User' minWidth={768}/>
          <ResponsiveButton onClick={this.handleUploadUsers} icon='cloud upload' text='Upload Users' minWidth={768}/>
          <ResponsiveButton onClick={this.handleSaveChanges} icon='save' text='Save Changes'  minWidth={768}/>
        </Button.Group>
        &nbsp;
        <Button.Group color='blue'>
          {this.renderExcelExportButton()}
        </Button.Group>
      </Segment>
     {updatingUsers ? <Segment attached>
      <Progress value={updateInfo.current} total={updateInfo.total} progress='ratio' indicating/>
      </Segment> : null}
      <Segment attached loading={updatingUsers}>
        <Table compact celled selectable sortable striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <Checkbox/>
              </Table.HeaderCell>
              <Table.HeaderCell/>
              <Table.HeaderCell 
                sorted={sortColumn === 'isVerified' ? sortDirection : null}
                onClick={this.handleSort('isVerified')}><Icon name='check'/></Table.HeaderCell>
              <Table.HeaderCell 
                sorted={sortColumn === 'name' ? sortDirection : null}
                onClick={this.handleSort('name')}>Name</Table.HeaderCell>
              <Table.HeaderCell 
                sorted={sortColumn === 'email' ? sortDirection : null}
                onClick={this.handleSort('email')}>Email</Table.HeaderCell>
              <Table.HeaderCell 
                  sorted={sortColumn === 'title' ? sortDirection : null}
                  onClick={this.handleSort('title')}>Title</Table.HeaderCell>
              <Table.HeaderCell 
                  sorted={sortColumn === 'capability' ? sortDirection : null}
                  onClick={this.handleSort('capability')}>Capability</Table.HeaderCell>
              <Table.HeaderCell 
                  sorted={sortColumn === 'industry' ? sortDirection : null}
                  onClick={this.handleSort('industry')}>Industry</Table.HeaderCell>
              <Table.HeaderCell>Last Response</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((u,i)=>{
              let isNew=(u._id||'').substr(0,3)==='new';
              return <Table.Row key={u._id} positive={isNew} warning={u.isModified} error={u.hasError}>
                <Table.Cell collapsing>
                  <Checkbox/>
                </Table.Cell>
                <Table.Cell collapsing>
                  <Popup trigger={<Button circular icon='edit' 
                  onClick={()=>{this.setState({ openProfileModal: true, editingItem: u });}} position='top left'/>}>
                    click here to edit the user
                  </Popup>
                </Table.Cell>
                <Table.Cell>{u.isVerified?<Icon name='check circle' color='green'/>: <Icon name='circle outline' color='green'/>}</Table.Cell>
                <Table.Cell>{u.name}</Table.Cell>
                <Table.Cell>{u.email}
                  <Label.Group color='blue'>
                    {u.roles.map((r,i)=>{
                      return <Label size='mini' key={i}>{r}</Label>
                    })}
                  </Label.Group>
                </Table.Cell>
                <Table.Cell>{u.title}</Table.Cell>
                <Table.Cell>{u.capability}</Table.Cell>
                <Table.Cell>{u.industry}</Table.Cell>
                <Table.Cell>{u.lastresponsedate ? (moment(u.lastresponsedate).fromNow() + ' - ' + moment(u.lastresponsedate).format('DD MMM YY')) : ''}</Table.Cell>
                <Table.Cell collapsing>
                  <Popup trigger={<Button circular icon='delete' onClick={()=>{
                    let users=this.state.users.slice(0,i).concat(this.state.users.slice(i+1));
                    let deletedItems=[].push(u);
                    this.setState({users, deletedItems})
                  }}/>} position='top right'>click here to delete the user</Popup>
                </Table.Cell>
              </Table.Row>
            })}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan='8'>
                <Menu floated='right' pagination>
                  <Menu.Item as='a' icon disabled={currentPage===1}>
                    <Icon name='chevron left' />
                  </Menu.Item>
                  {pages.map(i=><Menu.Item as='a' active={currentPage===i} onClick={()=>{
                    const pageNumber=i;
                    this.loadPage(pageNumber);
                  }} >{i}</Menu.Item>)}
                  <Menu.Item as='a' icon disabled={currentPage===pages.length}>
                    <Icon name='chevron right' />
                  </Menu.Item>
                </Menu>
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
      </Segment>
      <Segment attached='bottom'>

      </Segment>
    </div>
  }

  renderExcelExportButton() {
    return <ExcelFile element={<ResponsiveButton onClick={this.handleExport} icon='file'text='Export' minWidth={768}/>}>
      <ExcelSheet data={this.state.users} name='Users'>
        <ExcelColumn label='Name' value='name'/>
        <ExcelColumn label='Email' value='email'/>
        <ExcelColumn label="Registered" value={(u) => u.isVerified ? "Yes" : "No"}/>
        <ExcelColumn label="last response date" value='lastresponsedate'/>
        <ExcelColumn label="Title" value='title'/>
        <ExcelColumn label="Capability" value='capability'/>
        <ExcelColumn label="Industry" value='industry'/>
      </ExcelSheet>
    </ExcelFile>
  }

  renderNewUserModal() {
    return <Modal open={this.state.openNewUserModal} onClose={this.onCloseNewUserModal}>
      <Modal.Header><Icon name='user'/> New User</Modal.Header>
      <Modal.Content>
        <Form onSubmit={this.createNewUser}>
          <Form.Field>
            <label>User Email</label>
            <Form.Input value={this.state.newUserEmail} placeholder={'someone@'+this.state.domain} onChange={e=>{
              const nu=e.target.value.trim().toLowerCase();
              const idx=nu.indexOf('@');
              if (nu.substr(idx+1)===this.state.domain) {
                this.setState({newUserEmail: nu, nerror: null});
              } else {
                this.setState({nerror:'Invalid email.'})
              }
            }}/>
            {this.state.nerror?<Label basic color='red' pointing >{this.state.nerror}</Label>:null}
          </Form.Field> 
          <Form.Group widths='equal'>
            <Form.Button type="submit" color='green' disabled={this.state.nerror}>Update</Form.Button>
            <FormButton onClick={this.onCloseNewUserModal} floated="right">Cancel</FormButton>
          </Form.Group>
        </Form>
      </Modal.Content>
    </Modal>
  }

  renderUploadModal(){
    return <Modal open={this.state.openUploadModal} onClose={this.onCloseUploadModal}>
      <Modal.Header><Icon name='file excel'/> Upload Users</Modal.Header>
      <Modal.Content>
        <Form onSubmit={this.handleUpload}>
            <Form.Field>
              <label>CSV File</label>
              <input type="file" ref={this.fileInput} onChange={this.handlePreview}/>
            </Form.Field>
            <Form.Field>
              <label>Preview</label>
              <Form.TextArea value={this.state.filePreview} readOnly rows={5}/>
            </Form.Field>
            <Form.Group widths='equal'>
              <Form.Button type="submit" color='green'>Upload</Form.Button>
              <FormButton onClick={this.onCloseUploadModal} floated="right">Cancel</FormButton>
            </Form.Group>
        </Form>
      </Modal.Content>
    </Modal>
  }
  render(){
    return <Page loading={this.state.loading}>
      <Segment basic>
        <Header as={'h1'}> <Icon name="user circle"/>Users</Header>
        {this.renderError()}
        {this.renderFilterBar()}
        {this.renderUsers()}
        {this.renderNewUserModal()}
        {this.renderUploadModal()}
        {this.renderProfileModal()}
      </Segment>
    </Page>
  }
  onCloseProfileModal = () =>{
    this.setState({openProfileModal: false});
  }
  renderProfileModal() {
    const {openProfileModal, editingItem={}} = this.state;
    return <Modal open={openProfileModal} onClose={this.onCloseProfileModal} size='fullscreen'>
      <Modal.Content image scrolling>
        <ProfilePage userid={editingItem._id} onChange={modified=>{
          const users= [...this.state.users];
          for (let i=0;i<users.length;++i){
            if (users[i]._id===editingItem._id) {
              users[i] = modified;
              break;
            }
          }
          this.setState({users})
          this.onCloseProfileModal();
        }}/>
      </Modal.Content>
    </Modal>
  }
}

export default AdminUsersPage;
