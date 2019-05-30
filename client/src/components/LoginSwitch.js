import React,{Component} from 'react'

import {Loader} from 'semantic-ui-react';

import {ACCOUNT_API, getHeaders, getProfile} from '../config';

class LoginSwitch extends Component {
  state = {
    loading: true
  }
  
  async componentWillMount(){
    this.setState({loading: true})
    const errorHdr = 'Unable to retrive the logged in user profile.';
    try {
      const {profile, errors} = await getProfile()
      if (errors.length>0) {
        this.setState({loading: false, profile, errors:errors, errorHdr});
      } else {
        this.setState({loading: false, profile, errors:null, errorHdr:null});
      }
    } catch (err) {
      console.error(err);
      this.setState({profile: null, errors:['Unknown error.', 'Please try again.'], loading: false, errorHdr});
    }
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
