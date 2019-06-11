import React, {Component} from 'react';
import { Header, Button, Icon, Container, Message, Segment, Table, Checkbox, Popup, Modal, Form, FormButton, Label, Menu, Accordion, Input, Select } from 'semantic-ui-react';
import { isNullOrUndefined } from 'util';
import { getProfile, getHeaders } from '../../config'
import csv from "fast-csv";
import uuidv1 from 'uuid/v1';

import Page from '../../components/Page';
import ResponsiveButton from '../../components/ResponsiveButton'

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
      const {profile, errors} = await getProfile();
      if (profile) {
        const idx= profile.email.indexOf('@');
        const domain=profile.email.substr(idx+1);
        this.setState({profile,domain})
      }
    } catch (err) {
      console.error(err)
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
        sortDirection: '1',
      },()=>this.loadUsers())
      return
    }
    this.setState({
      sortDirection: sortDirection === 1 ? -1 : 1,
    }, ()=>this.loadUsers())
  }

  loadPage = (pageNumber) => {
    this.setState({offset: (pageNumber-1)*this.state.limit, loading: true},()=>this.loadUsers());
  }
  loadUsers = async ()=>{
    try {
      this.setState({loading: true, error:null});
      const headers=getHeaders();
      const res = await fetch(`/api/user?offset=${this.state.offset}&limit=${this.state.limit}&sort=${this.state.sortDirection===-1?'-':''}${this.state.sortColumn}`,
          { headers})

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

  handleNewUser = async (e) => {
    this.setState({openNewUserModal: true});
  }

  handleUploadUsers = async (e) => {
    this.setState({openUploadModal: true});
  }

  handleUpload = event => {
    event.preventDefault();
    const fileData = this.state.filePreview || "";
    const newItems = [];
    csv.fromString(fileData,{headers: false, delimiter:'\t'})
      .on('data', (data)=>{
        const _id="new"+uuidv1();
        const oid = data[0];
        const email=data[1]||''
        const name=data[2]||'';
        const title = data[3]||'';
        newItems.push({
          _id, 
          email,
          name,
          title
        })
      })
      .on('end', () => {
        this.setState({
          openUploadModal: false,
          users:[...newItems,this.state.users],
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

  renderError(){
    const {error} = this.state;
    if (isNullOrUndefined(error)) return null;

    const {header='', errors=[]} = error;
    return <Message error header={header} list={errors} />
  }

  renderFilterBar(){
    return <div>
      <Accordion panels={[
        { 
          key: 'filterpane',
          title: {
            content:<span><Icon name='filter'/> Filter Options</span>
          },
          content:{
            content:
            <Form onSubmit={this.loadUsers}>
              <Form.Group widths='equal'>
                <Form.Field control={Input} label='Name' placeholder='ra*' value={this.state.nameFilter} 
                  onChange={e=>this.setState({nameFilter: e.target.value})}/>
                <Form.Field control={Input} label='Email' placeholder='rak*' value={this.state.emailFilter} 
                  onChange={e=>this.setState({emailFilter: e.target.value})}/>
                {/* <Form.Field control={Select} label='Gender' options={options} placeholder='Gender' /> */}
              </Form.Group>
              <Form.Field control={Button}>Refresh</Form.Field>
            </Form>
          }
        }
      ]}/>
    </div>
  }

  renderUsers(){
    const {users, sortColumn, sortDirection} = this.state;
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
      </Segment>
      <Segment attached>
        <Table compact celled selectable sortable striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <Checkbox/>
              </Table.HeaderCell>
              <Table.HeaderCell/>
              <Table.HeaderCell 
                sorted={sortColumn === 'name' ? sortDirection : null}
                onClick={this.handleSort('name')}>Name</Table.HeaderCell>
              <Table.HeaderCell 
                sorted={sortColumn === 'email' ? sortDirection : null}
                onClick={this.handleSort('email')}>Email</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((u,i)=>{
              return <Table.Row key={u._id}>
                <Table.Cell collapsing>
                  <Checkbox/>
                </Table.Cell>
                <Table.Cell collapsing>
                  <Popup trigger={<Button circular icon='edit' onClick={e=>{this.setState({ openEditModal: true, editingItem: u });}}/>}>
                    click here to edit the user
                  </Popup>
                </Table.Cell>
                <Table.Cell>{u.name}</Table.Cell>
                <Table.Cell>{u.email}</Table.Cell>
                <Table.Cell collapsing>
                  {/* <Popup trigger={<Button circular icon='delete' onClick={e=>{
                    let users=this.state.users.slice(0,i).concat(this.state.users.slice(i+1));
                    let deletedItems=[].push(u);
                    this.setState({users, deletedItems})
                  }}/>}>click here to delete the user</Popup> */}
                </Table.Cell>
              </Table.Row>
            })}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan='5'>
                <Menu floated='right' pagination>
                  <Menu.Item as='a' icon disabled={currentPage===1}>
                    <Icon name='chevron left' />
                  </Menu.Item>
                  {pages.map(i=><Menu.Item as='a' active={currentPage===i} onClick={e=>{
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
      <Container>
        <Segment>
        <Header as={'h1'}> <Icon name="user circle"/>Users</Header>
        {this.renderError()}
        {this.renderFilterBar()}
        <br/>
        <br/>
        {this.renderUsers()}
        {this.renderNewUserModal()}
        {this.renderUploadModal()}
        </Segment>
      </Container>
    </Page>
  }
}

export default AdminUsersPage;
