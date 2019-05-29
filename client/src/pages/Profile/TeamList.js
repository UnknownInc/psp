import React, {Component} from 'react';
import { Container, Form, Header, Segment, Table, Icon, Checkbox, Button, Divider, Message, Popup, Responsive,Modal, FormButton, Tab, Comment, Loader, Input } from 'semantic-ui-react';

import { ACCOUNT_API, getHeaders } from '../../config'
import TeamView from './TeamView';

class TeamList extends Component {
  constructor(props) {
    super(props);
    this.state={
      loading: true
    }
  }

  async componentWillMount(){
    this.setState({loading: true, errorHdr:null, errors:[]})
    try{
      const headers= getHeaders();
      const response = await fetch(`${ACCOUNT_API}/api/team?user=${this.props.user}`, {headers})

      if (response.status===401) {
        return this.setState({loading: false, errorHdr:'Not logged in.', errors:[]})
      }
      if (response.status>=400) {
        return this.setState({loading: false, errorHdr:'Unknown error', errors:[]})
      }
      const teams = await response.json();
      this.setState({loading: false, errorHdr:null, errors:[], teams});
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
      {teams.map((t)=><TeamView team={t} key={t._id}/>)}
    </div>
  }
}


export default TeamList;
