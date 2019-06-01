import React, {Component} from 'react';
import { Container, Form, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton, Tab, Comment, Loader, Input } from 'semantic-ui-react';

import { ACCOUNT_API, getHeaders } from '../../config'
import TeamView from './TeamView';

class TeamList extends Component {
  constructor(props) {
    super(props);
    this.state={
      userid: this.props.user,
      loading: true
    }
  }

  async componentWillMount(){
    this.setState({loading: true, errorHdr:null, errors:[]})
    try{
      const headers= getHeaders();
      const response = await fetch(`${ACCOUNT_API}/api/team?user=${this.props.user}`, {headers})

      if (response.ok) {
        const teams = await response.json();
        this.setState({loading: false, errorHdr:null, errors:[], teams});
        return;
      }

      switch(response.status) {
        case 401: {
            return this.setState({loading: false, errorHdr:'Not logged in.', errors:[]})
        }
        case 403: {
          return this.setState({loading: false, errorHdr:'Not Authorized.', errors:[]})
        }
        default: throw new Error('Invalid status from the server.')
      }
    } catch (err) {
      this.setState({loading: false, errorHdr:'Unable to retrive the teams.', errors:[]})
    }
  }

  renderErrors(){
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  render(){
    const {teams=[]}= this.state;
    return <div>
      {this.renderErrors()}
      <Header as={'h3'} dividing>My Teams <small><Popup trigger={<Button icon='plus'/>}>Create a new team</Popup></small></Header>
      {teams.map((t)=><TeamView team={t} key={t._id}/>)}
    </div>
  }
}


export default TeamList;
