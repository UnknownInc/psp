import React, { Component } from 'react'
import { notify } from 'react-notify-toast'
import Spinner from '../components/Spinner'
import { getProfile } from '../config'
import Home from './Home'
import { Form} from 'semantic-ui-react';
import Page from '../components/Page';

export default class Landing extends Component {

  // A bit of state to give the user feedback while their email address is being 
  // added to the User model on the server.
  state = {
    loading: true,
    email:'',
    iagree: false,
    sendingEmail: false
  }

  async componentDidMount() {
    this.setState({loading: true})

    const errorHdr = 'Unable to retrive the user profile.';
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

  handleChange = (event, {name, value}) => {
    this.setState({[name]: value})
  }

  handleCheckboxChange = (e,{checked})=>{
    this.setState({iagree: checked})
  }

  onSubmit = async event => {
    event.preventDefault()
    this.setState({ sendingEmail: true})
    try{
    const res = await fetch(`/api/user/register`, {
      method: 'POST',
      headers: {
        accept: 'application/json', 
        'content-type': 'application/json'
      },
      body: JSON.stringify({ email: this.state.email })
    })
    const data = await res.json() 
    
    if (res.status===200){
      // Everything has come back successfully, time to update the state to 
      // reenable the button and stop the <Spinner>. Also, show a toast with a 
      // message from the server to give the user feedback and reset the form 
      // so the user can start over if she chooses.
      notify.show(data.message)
    } else if (res.status>=400) {
      notify.show(data.error);
    }
    this.setState({ sendingEmail: false})
    //this.form.reset()
    } catch(err) {
      console.log(err)
      notify.show('Error Registering! Please try again.')
      this.setState({ sendingEmail: false})
    }
  }

  renderHome = () =>{
    return <Home profile={this.state.profile}/>
  }

  render = () => {
    const { sendingEmail, email, iagree } = this.state

    if (this.state.loading) {
        return <Spinner size='massive' message='Loading...' />
    }

    if (this.state.profile) {
      return this.renderHome()
    }

    return (
    <Page loading={sendingEmail}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'80vh'}}>
        <Form
          onSubmit={this.onSubmit}>
          <Form.Group>
          <Form.Input
            placeholder='Your work email'
            name='email'
            type='email'
            value={email}
            onChange={this.handleChange}
            required
            error={!iagree}
            size='huge'
            disabled={!iagree }
            action={{color:'blue', content:'Register'}}
          />
          </Form.Group>
          <Form.Group>
            <Form.Checkbox
              name='iagree'
              label='I agree to the Terms and Conditions'
              checked={iagree}
              onChange={this.handleCheckboxChange}
              />
          </Form.Group>
        </Form>
      </div>
    </Page>)
  }
}
