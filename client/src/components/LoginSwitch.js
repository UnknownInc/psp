import React,{Component} from 'react'

import {Loader} from 'semantic-ui-react';

import {ACCOUNT_API, getHeaders} from '../config';

class LoginSwitch extends Component {
  state = {
    loading: true
  }
  
  componentWillMount(){
    this.setState({loading: true})
    const headers= getHeaders();
    
    fetch(`${ACCOUNT_API}/api/profile`, { headers})
      .then(res => res.json())
      .then(profile => {
        if (profile.error) {
          this.setState({loading: false, profile: null})
        } else { 
          this.setState({loading: false, profile})
        }
      })
      .catch(err=>{
        this.setState({loading: false, profile: null})
      })
  }


  render() {
    if (this.state.loading) {
      return this.props.loadingView||<Loader inline content={''} size='tiny'/>
    }

    if (this.state.profile) {
      if (this.state.profile.isAdmin && this.props.adminView){
        return this.props.adminView
      }
      return this.props.loggedInView||null;
    }

    return this.props.defaultView||null;
  }
}

export default LoginSwitch;
