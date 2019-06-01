import React, {Component} from 'react';
import { Header, Button, Icon, Container, Message, Segment, Table, Checkbox, Popup } from 'semantic-ui-react';
import { isNullOrUndefined } from 'util';
import { USER_API, getHeaders } from '../../config'

import Page from '../../components/Page';
import ResponsiveButton from '../../components/ResponsiveButton'

class AdminUsersPage extends Component {
  constructor(props){
    super(props);
    this.state={
      loading: true,
      offset:0,
      limit: 100,
      pageSize: 50,
      users:[]
    }
  }

  componentDidMount(){
    this.loadUsers();
  }

  handleSort = clickedColumn => () => {
    const { users, sortDirection, sortColumn } = this.state

    if (sortColumn !== clickedColumn) {
      this.setState({
        sortColumn: clickedColumn,
        users: users.sort((a,b)=>a[clickedColumn]>b[clickedColumn]?1:-1),
        sortDirection: 'ascending',
      })
      return
    }
    this.setState({
      users: users.reverse(),
      sortDirection: sortDirection === 'ascending' ? 'descending' : 'ascending',
    })
  }

  loadUsers= async ()=>{
    try {
      this.setState({loading: true, error:null});
      const headers=getHeaders();
      const res = await fetch(`${USER_API}/api/user?offset=${this.state.offset}&limit=${this.state.limit}`, { headers})

      if (!res.ok) {
        return this.setState({loading: false, error:{header:res.statusText}})
      }

      const data = await res.json()
      this.setState({loading: false, users:[...this.state.users,...data]})

    } catch (err) {
      const error={header:'Unable to load users.'}
      error.errors=[ JSON.stringify(err)];
      this.setState({loading: false, error})
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

    </div>
  }

  renderUsers(){
    const {users, sortColumn, sortDirection} = this.state;
    return <div>
      <Segment attached='top'>
        <Button.Group color='blue'>
          <ResponsiveButton onClick={this.handleNewQuestion} icon='user'text='New User' minWidth={768}/>
          <ResponsiveButton onClick={this.handleUploadQuestions} icon='cloud upload' text='Upload Users' minWidth={768}/>
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
                  <Popup trigger={<Button circular icon='delete' onClick={e=>{
                    let users=this.state.users.slice(0,i).concat(this.state.users.slice(i+1));
                    let deletedItems=[].push(u);
                    this.setState({users, deletedItems})
                  }}/>}>click here to delete the user</Popup>
                </Table.Cell>
              </Table.Row>
            })}
          </Table.Body>
        </Table>
      </Segment>
      <Segment attached='bottom'>
      </Segment>
    </div>
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
        </Segment>
      </Container>
    </Page>
  }
}

export default AdminUsersPage;
