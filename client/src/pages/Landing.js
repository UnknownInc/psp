import React, { Component } from 'react'
import { notify } from 'react-notify-toast'
import Spinner from '../components/Spinner'
import { getProfile } from '../config'
import Home from './Home'
import { Form} from 'semantic-ui-react';
import Page from '../components/Page';
import VError from 'verror';
export default class Landing extends Component {

  // A bit of state to give the user feedback while their email address is being 
  // added to the User model on the server.
  state = {
    loading: true,
    loadingMessage: 'Loading...',
    iagree: false,
    sendingEmail: false,
    attemptEmail: window.localStorage.getItem('registerAttempt')
  }

  async componentDidMount() {
    await this.loadProfile();
  }

  loadProfile = async () =>{
    this.setState({loading: true})

    const errorHdr = 'Unable to retrive the user profile.';
    // const errors = [];
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
    } finally {

    }
  }

  handleChange = (event, {name, value}) => {
    this.setState({[name]: value})
  }

  handleCheckboxChange = (e,{checked})=>{
    this.setState({iagree: checked})
  }

  onVerify = async () => {
    this.setState({loading:true, loadingMessage:'Verifying the code...'})
    try{
      const res = await fetch(`/api/user/verify`,{
          method: 'POST',
          headers: {
            accept: 'application/json', 
            'content-type': 'application/json'
          },
          body: JSON.stringify({token: this.state.code.trim(), email: this.state.email.trim()})
        })
      
        if (!res.ok) {
          throw new VError({
            name:'APIError',
            cause: res.statusText,
            info:{
              statusCode: res.statusCode,
            }
          });
        }
        const data = await res.json()
        window.localStorage.setItem('m360t', data.token);
        notify.show(data.message)
        await this.loadProfile();
    } catch(err) {
      console.log(err);
      notify.show('Error confirming the code! Please try again.')
    } finally {
      this.setState({loading: false})
    }

  }

  onSubmit = async event => {
    event.preventDefault()
    if (this.state.code && this.state.email) {
      return await this.onVerify()
    }
    try{
      this.setState({ sendingEmail: true});
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
        const email = this.state.email;
        notify.show(data.message)
        window.localStorage.setItem('registerAttempt', email);
        this.setState({attemptEmail: email})
      } else if (res.status>=400) {
        notify.show(data.error);
      }
      //this.form.reset()
    } catch(err) {
      console.log(err)
      notify.show('Error Registering! Please try again.')
    } finally {
      this.setState({ sendingEmail: false})
    }
  }

  renderHome = () =>{
    return <Home profile={this.state.profile}/>
  }

  renderConfirmationBox = () => {
    const { iagree, attemptEmail, code } = this.state
    if (!attemptEmail) {
      return null;
    }

    return <Form.Group>
      <Form.Input
        placeholder='Code that was send to your email'
        name='code'
        type='text'
        value={code}
        onChange={this.handleChange}
        required
        error={!code || code===''}
        size='huge'
        disabled={!iagree }
        action={{color:'blue', content:'Confirm'}}
      />

    </Form.Group>
  }

  render = () => {
    const { sendingEmail, email, iagree, attemptEmail, loadingMessage } = this.state

    if (this.state.loading) {
        return <Spinner size='massive' message={loadingMessage} />
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
              value={email||attemptEmail}
              onChange={this.handleChange}
              required
              error={!iagree}
              size='huge'
              disabled={!iagree }
              action={attemptEmail ? null : {color:'blue', content:'Register'}}
            />
          </Form.Group>
          <Form.Group>
            <Form.Checkbox
              name='iagree'
              checked={iagree}
              onChange={this.handleCheckboxChange}
              />
            <label>I agree to the <u>Terms and Conditions</u></label>
          </Form.Group>
          {this.renderConfirmationBox()}
        </Form>
      </div>
    </Page>)
  }
}
