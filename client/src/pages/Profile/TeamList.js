import React, {Component} from 'react';
import { Header, Button, Message, Popup, Accordion, Label, Icon, Grid, GridColumn } from 'semantic-ui-react';

import { getProfile, getHeaders } from '../../config'
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
      const res= await getProfile();
      
      this.setState({loggedInUserId: res.profile._id});
      if (this.props.preload) {
        await this.loadTeams()
      }
    } catch (err) {
      this.setState({loading: false, errorHdr:'Unable to retrive the teams.', errors:[]})
    }
  }

  loadTeams=async () => {
    this.setState({loading: true, errorHdr:null, errors:[]})
    try{

      const headers= getHeaders();
      const response = await fetch(`/api/team?user=${this.props.user}`, {headers})

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
    }catch (err) {
      this.setState({loading: false, errorHdr:'Unable to retrive the teams.', errors:[]})
    }
  }

  renderErrors(){
    const {errorHdr, errors=[]} = this.state;
    if (!errorHdr) return null
    return <Message error header={errorHdr} list={errors} />
  }

  render(){
    const {teams=[], loggedInUserId, userid}= this.state;
    return <div>
      {this.renderErrors()}
      {/*loggedInUserId===userid?<Popup trigger={<Button icon='plus' content='Add new team'/>}>Add a new team</Popup>:null*/}
      <div>
        {teams.length===0?<a onClick={this.loadTeams}>Show Teams ...</a>:null}
      </div>
      <Accordion panels={teams.map((t)=>{
        const {name, children=[]}=t;
        return {
          key: t._id,
          title: {
            content:<span>
              <Icon name='users'/> {name} <Label circular color={'grey'}>{children.length}</Label>
            </span>
          },
          content:{
            content:<TeamView team={t} key={t._id} loggedInUserId={loggedInUserId} styled/>
          }
        }
      })} exclusive={false} styled fluid/>
    </div>
  }
}


export default TeamList;
